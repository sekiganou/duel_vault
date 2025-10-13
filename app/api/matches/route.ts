import { client } from "@/client";
import {
  getStatDecrements,
  updateTournamentDeckStats,
} from "@/lib/api/matches";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { DeleteMatchesSchema, UpsertMatchSchema } from "@/lib/schemas/matches";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { JsonDatabase } from "brackets-json-db";
import { BracketsManager } from "brackets-manager";
import { getMinioClient } from "@/s3";
import fs from "fs";
import { BRACKET_BUCKET } from "@/s3/buckets";

type MatchResult = "win" | "loss" | "tie";

// Helper to determine match results for both decks
const getMatchResults = (
  winnerId: number | null,
  deckAId: number,
  deckBId: number
): { deckA: MatchResult; deckB: MatchResult } => {
  if (winnerId === deckAId) return { deckA: "win", deckB: "loss" } as const;
  if (winnerId === deckBId) return { deckA: "loss", deckB: "win" } as const;
  return { deckA: "tie", deckB: "tie" } as const;
};

// Helper to calculate stat changes for deck updates
const calculateStatChanges = (
  deck: {
    id: number;
    wins: number;
    losses: number;
    ties: number;
  },
  before: MatchResult | null,
  after: MatchResult
) => {
  const changes: Record<string, { increment?: number; decrement?: number }> =
    {};

  // For new matches (no before state) or when result changed
  if (!before || before !== after) {
    // Remove previous result (only if there was a previous result)
    if (before === "win" && deck.wins > 0) {
      changes["wins"] = { decrement: 1 };
    } else if (before === "loss" && deck.losses > 0) {
      changes["losses"] = { decrement: 1 };
    } else if (before === "tie" && deck.ties > 0) {
      changes["ties"] = { decrement: 1 };
    }

    // Add new result
    if (after === "win") {
      changes["wins"] = { ...(changes["wins"] || {}), increment: 1 };
    } else if (after === "loss") {
      changes["losses"] = { ...(changes["losses"] || {}), increment: 1 };
    } else if (after === "tie") {
      changes["ties"] = { ...(changes["ties"] || {}), increment: 1 };
    }
  }

  return changes;
};

export const GET = withErrorHandler(async () => {
  const items = await client.match.findMany({
    include: {
      tournament: true,
      deckA: {
        include: {
          archetype: true,
          format: true,
        },
      },
      deckB: {
        include: {
          archetype: true,
          format: true,
        },
      },
      winner: {
        include: {
          archetype: true,
          format: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return NextResponse.json(items);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = UpsertMatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation Error", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const { id, date, bracket, ...dataWithoutId } = parsed.data;
  const matchData = {
    ...dataWithoutId,
    date: new Date(date),
  };

  // Use a single transaction to ensure data consistency
  const updatedMatch = await client.$transaction(async (tx) => {
    // Get existing match data only if we're updating (not creating)
    const matchBefore = id
      ? await tx.match.findUnique({
          where: { id },
          select: {
            tournamentId: true,
            winnerId: true,
            deckAId: true,
            deckBId: true,
          },
        })
      : null;

    const tournamentIdBefore = matchBefore?.tournamentId ?? null;
    const tournamentIdAfter = matchData.tournamentId;
    const winnerIdBefore = matchBefore?.winnerId ?? null;
    const winnerIdAfter = matchData.winnerId;

    // Save the match
    const updatedMatch = await tx.match.upsert({
      where: { id: id ?? -1 },
      create: matchData,
      update: matchData,
    });

    const deckAId = matchData.deckAId;
    const deckBId = matchData.deckBId;

    // Get current deck stats
    const [deckA, deckB] = await Promise.all([
      tx.deck.findUnique({
        where: { id: deckAId },
        select: { id: true, wins: true, losses: true, ties: true },
      }),
      tx.deck.findUnique({
        where: { id: deckBId },
        select: { id: true, wins: true, losses: true, ties: true },
      }),
    ]);

    if (!deckA || !deckB) {
      throw new Error("Deck not found");
    }

    // Calculate stat changes using extracted helper
    const resultsBefore = getMatchResults(winnerIdBefore, deckAId, deckBId);
    const resultsAfter = getMatchResults(winnerIdAfter, deckAId, deckBId);

    const deckAChanges = calculateStatChanges(
      deckA,
      resultsBefore?.deckA || null,
      resultsAfter.deckA
    );
    const deckBChanges = calculateStatChanges(
      deckB,
      resultsBefore?.deckB || null,
      resultsAfter.deckB
    );

    // Update deck stats only if there are changes
    const updates = [];
    if (Object.keys(deckAChanges).length > 0) {
      updates.push(
        tx.deck.update({
          where: { id: deckAId },
          data: deckAChanges,
        })
      );
    }
    if (Object.keys(deckBChanges).length > 0) {
      updates.push(
        tx.deck.update({
          where: { id: deckBId },
          data: deckBChanges,
        })
      );
    }
    await Promise.all(updates);

    // Update tournament stats based on tournament changes
    const tournamentUpdates = [];

    if (
      tournamentIdBefore &&
      tournamentIdAfter &&
      tournamentIdBefore !== tournamentIdAfter
    ) {
      // Match moved between tournaments - update both
      tournamentUpdates.push(
        updateTournamentDeckStats(tx, tournamentIdBefore, deckAId),
        updateTournamentDeckStats(tx, tournamentIdBefore, deckBId),
        updateTournamentDeckStats(tx, tournamentIdAfter, deckAId),
        updateTournamentDeckStats(tx, tournamentIdAfter, deckBId)
      );
    } else if (!tournamentIdBefore && tournamentIdAfter) {
      // Match added to tournament
      tournamentUpdates.push(
        updateTournamentDeckStats(tx, tournamentIdAfter, deckAId),
        updateTournamentDeckStats(tx, tournamentIdAfter, deckBId)
      );
    } else if (tournamentIdBefore && !tournamentIdAfter) {
      // Match removed from tournament
      tournamentUpdates.push(
        updateTournamentDeckStats(tx, tournamentIdBefore, deckAId),
        updateTournamentDeckStats(tx, tournamentIdBefore, deckBId)
      );
    } else if (
      tournamentIdBefore &&
      tournamentIdAfter &&
      tournamentIdBefore === tournamentIdAfter
    ) {
      // Match stays in same tournament but winner might have changed
      tournamentUpdates.push(
        updateTournamentDeckStats(tx, tournamentIdAfter, deckAId),
        updateTournamentDeckStats(tx, tournamentIdAfter, deckBId)
      );
    }

    await Promise.all(tournamentUpdates);
    return updatedMatch;
  });

  if (bracket != null) {
    try {
      const filename = `tournament-${matchData.tournamentId}-stage-1.json`;

      const minio = getMinioClient();
      const fileStream = await minio.getObject(BRACKET_BUCKET, filename);

      // Convert stream to string
      const chunks = [];
      for await (const chunk of fileStream) {
        chunks.push(chunk);
      }
      const fileContent = Buffer.concat(chunks).toString();

      // Write the file locally so JsonDatabase can read it
      await fs.promises.writeFile(filename, fileContent);

      // Initialize the storage and manager
      const storage = new JsonDatabase(filename);
      const manager = new BracketsManager(storage);

      await manager.update.match({
        id: bracket.matchId,
        opponent1: {
          id: bracket.opponent1,
          score: updatedMatch.deckAScore,
          result:
            updatedMatch.deckAScore > updatedMatch.deckBScore
              ? "win"
              : updatedMatch.deckAScore < updatedMatch.deckBScore
                ? "loss"
                : "draw",
        },
        opponent2: { id: bracket.opponent2, score: updatedMatch.deckBScore },
      });

      // Save the updated bracket back to MinIO
      const updatedContent = await fs.promises.readFile(filename, "utf-8");
      await minio.putObject(BRACKET_BUCKET, filename, updatedContent);

      // Clean up the local file
      await fs.promises.unlink(filename);
    } catch (bracketError) {
      console.error("Error updating bracket:", bracketError);
      // Don't throw here - the match was already saved successfully
      // Just log the error and continue
    }
  }
  return NextResponse.json({ success: true, item: updatedMatch });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = DeleteMatchesSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid ID(s)", details: parsed.error },
      { status: 400 }
    );
  }

  const ids = parsed.data;

  await client.$transaction(async (tx) => {
    // Get match details before deletion to update deck stats
    const matches = await tx.match.findMany({
      where: { id: { in: ids } },
      include: {
        deckA: {
          select: { id: true, wins: true, losses: true, ties: true },
        },
        deckB: {
          select: { id: true, wins: true, losses: true, ties: true },
        },
      },
    });

    if (!matches || matches.length === 0) {
      throw new Error("Matches not found");
    }

    for (const match of matches) {
      const { id, deckAId, deckBId, winnerId, tournamentId } = match;

      // Calculate stat decrements for deck stats
      const deckADecrements = getStatDecrements(
        winnerId,
        deckAId,
        match.deckA.wins,
        match.deckA.losses,
        match.deckA.ties
      );
      const deckBDecrements = getStatDecrements(
        winnerId,
        deckBId,
        match.deckB.wins,
        match.deckB.losses,
        match.deckB.ties
      );

      // Update deck stats and delete match in parallel
      await Promise.all([
        tx.deck.update({
          where: { id: deckAId },
          data: deckADecrements,
        }),
        tx.deck.update({
          where: { id: deckBId },
          data: deckBDecrements,
        }),
        tx.match.delete({ where: { id: id } }),
      ]);

      // Recalculate tournament stats if match was part of a tournament
      if (tournamentId) {
        await Promise.all([
          updateTournamentDeckStats(tx, tournamentId, deckAId),
          updateTournamentDeckStats(tx, tournamentId, deckBId),
        ]);
      }
    }
  });

  return NextResponse.json({ success: true, ids });
});
