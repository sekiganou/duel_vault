import { db } from "@/db";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { UpsertMatchSchema } from "@/lib/schemas/matches";
import { DeckWithRelations } from "@/types";
import { match } from "assert";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { fi } from "zod/v4/locales/index.cjs";

type MatchResult = "win" | "loss" | "tie";
type PrismaTransaction = Parameters<Parameters<typeof db.$transaction>[0]>[0];

// Shared tournament stats update logic
const updateTournamentDeckStats = async (
  tx: PrismaTransaction,
  tournamentId: number,
  deckId: number
) => {
  const [tournament, deck] = await Promise.all([
    tx.tournament.findUnique({
      where: { id: tournamentId },
      include: { matches: true },
    }),
    tx.deck.findUnique({ where: { id: deckId } }),
  ]);

  if (!tournament || !deck) return;

  // Only count matches where this deck actually participated
  const deckMatches = tournament.matches.filter(
    (match: { deckAId: number; deckBId: number; winnerId: number | null }) =>
      match.deckAId === deckId || match.deckBId === deckId
  );

  const wins = deckMatches.reduce(
    (acc: number, match: { winnerId: number | null }) =>
      acc + (match.winnerId === deckId ? 1 : 0),
    0
  );

  const losses = deckMatches.reduce(
    (acc: number, match: { winnerId: number | null }) =>
      acc + (match.winnerId && match.winnerId !== deckId ? 1 : 0),
    0
  );

  const ties = deckMatches.reduce(
    (acc: number, match: { winnerId: number | null }) =>
      acc + (match.winnerId === null ? 1 : 0),
    0
  );

  if (wins === 0 && losses === 0 && ties === 0) {
    // Delete stats if deck has no matches in this tournament
    await tx.tournamentDeckStats.deleteMany({
      where: {
        tournamentId: tournament.id,
        deckId: deck.id,
      },
    });
  } else {
    // Update stats with recalculated values
    await tx.tournamentDeckStats.upsert({
      where: {
        tournamentId_deckId: {
          tournamentId: tournament.id,
          deckId: deck.id,
        },
      },
      create: {
        wins: wins,
        losses: losses,
        ties: ties,
        tournamentId: tournament.id,
        deckId: deck.id,
      },
      update: {
        wins: wins,
        losses: losses,
        ties: ties,
      },
    });
  }
};

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
  const items = await db.match.findMany({
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

  const { id, date, ...dataWithoutId } = parsed.data;
  const matchData = {
    ...dataWithoutId,
    date: new Date(date),
  };

  // Use a single transaction to ensure data consistency
  const result = await db.$transaction(async (tx) => {
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

  return NextResponse.json({ success: true, item: result });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "");

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    // Get match details before deletion to update deck stats
    const match = await tx.match.findUnique({
      where: { id },
      include: {
        deckA: {
          select: { id: true, wins: true, losses: true, ties: true },
        },
        deckB: {
          select: { id: true, wins: true, losses: true, ties: true },
        },
      },
    });

    if (!match) {
      throw new Error("Match not found");
    }

    const { deckAId, deckBId, winnerId, tournamentId } = match;

    // Calculate stat decrements for deck stats
    const getStatDecrements = (
      deckId: number,
      wins: number,
      losses: number,
      ties: number
    ) => {
      if (winnerId === deckId)
        return { wins: { decrement: wins === 0 ? 0 : 1 } };
      if (winnerId && winnerId !== deckId)
        return { losses: { decrement: losses === 0 ? 0 : 1 } };
      return { ties: { decrement: ties === 0 ? 0 : 1 } };
    };

    // Update deck stats and delete match in parallel
    await Promise.all([
      tx.deck.update({
        where: { id: deckAId },
        data: getStatDecrements(
          deckAId,
          match.deckA.wins,
          match.deckA.losses,
          match.deckA.ties
        ),
      }),
      tx.deck.update({
        where: { id: deckBId },
        data: getStatDecrements(
          deckBId,
          match.deckB.wins,
          match.deckB.losses,
          match.deckB.ties
        ),
      }),
      tx.match.delete({ where: { id } }),
    ]);

    // Recalculate tournament stats if match was part of a tournament
    if (tournamentId) {
      await Promise.all([
        updateTournamentDeckStats(tx, tournamentId, deckAId),
        updateTournamentDeckStats(tx, tournamentId, deckBId),
      ]);
    }
  });

  return NextResponse.json({ success: true, deletedId: id });
});
