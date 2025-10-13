import { client } from "@/client";
import {
  getStatDecrements,
  updateTournamentDeckStats,
} from "@/lib/api/matches";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { NextRequest, NextResponse } from "next/server";

const schema = client.match;

export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const id = parseInt(pathSegments[pathSegments.length - 1]);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
  }
  const match = await schema.findUnique({
    where: { id },
    include: {
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
      winner: true,
      tournament: true,
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json(match);
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const id = parseInt(pathSegments[pathSegments.length - 1]);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  await client.$transaction(async (tx) => {
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
