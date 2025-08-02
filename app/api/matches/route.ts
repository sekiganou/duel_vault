import { db } from "@/db";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { UpsertMatchSchema } from "@/lib/schemas/matches";
import { DeckWithRelations } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

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
          select: { winnerId: true, deckAId: true, deckBId: true },
        })
      : null;

    const winnerIdBefore = matchBefore?.winnerId ?? null;
    const winnerIdAfter = matchData.winnerId;

    // Save the match
    const savedMatch = await tx.match.upsert({
      where: { id: id ?? -1 },
      create: matchData,
      update: matchData,
    });

    // Skip stats update if winner didn't change (for edits where only notes/scores changed)
    if (id && winnerIdBefore === winnerIdAfter) {
      return savedMatch;
    }

    type MatchResult = "win" | "loss" | "tie";

    const deckAId = matchData.deckAId;
    const deckBId = matchData.deckBId;

    // Get current deck stats
    const deckA = await tx.deck.findUnique({
      where: { id: deckAId },
      select: { id: true, wins: true, losses: true, ties: true },
    });
    const deckB = await tx.deck.findUnique({
      where: { id: deckBId },
      select: { id: true, wins: true, losses: true, ties: true },
    });

    if (!deckA || !deckB) {
      throw new Error("Deck not found");
    }

    // Determine match results efficiently
    const getMatchResults = (
      winnerId: number | null
    ): { deckA: MatchResult; deckB: MatchResult } => {
      if (winnerId === deckAId) return { deckA: "win", deckB: "loss" } as const;
      if (winnerId === deckBId) return { deckA: "loss", deckB: "win" } as const;
      return { deckA: "tie", deckB: "tie" } as const;
    };

    const resultsBefore = getMatchResults(winnerIdBefore);
    const resultsAfter = getMatchResults(winnerIdAfter);

    // Helper to calculate stat changes
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
      const changes: Record<
        string,
        { increment?: number; decrement?: number }
      > = {};

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
    if (Object.keys(deckAChanges).length > 0) {
      await tx.deck.update({
        where: { id: deckAId },
        data: deckAChanges,
      });
    }

    if (Object.keys(deckBChanges).length > 0) {
      await tx.deck.update({
        where: { id: deckBId },
        data: deckBChanges,
      });
    }

    return savedMatch;
  });

  return NextResponse.json({ success: true, item: result });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "");

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Get match details before deletion to update deck stats
  const match = await db.match.findUnique({
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
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const { deckAId, deckBId, winnerId } = match;

  const getStatDecrements = (
    deckId: number,
    wins: number,
    losses: number,
    ties: number
  ) => {
    if (winnerId === deckId) return { wins: { decrement: wins === 0 ? 0 : 1 } };
    if (winnerId && winnerId !== deckId)
      return { losses: { decrement: losses === 0 ? 0 : 1 } };
    return { ties: { decrement: ties === 0 ? 0 : 1 } };
  };

  await db.$transaction([
    db.deck.update({
      where: { id: deckAId },
      data: getStatDecrements(
        deckAId,
        match.deckA.wins,
        match.deckA.losses,
        match.deckA.ties
      ),
    }),
    db.deck.update({
      where: { id: deckBId },
      data: getStatDecrements(
        deckBId,
        match.deckB.wins,
        match.deckB.losses,
        match.deckB.ties
      ),
    }),
    db.match.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true, deletedId: id });
});
