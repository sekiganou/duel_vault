import { db } from "@/db";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { UpsertTournamentDeckStatsSchema } from "@/lib/schemas/tournamentDeckStats";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const tournamentId = parseInt(pathSegments[pathSegments.length - 2]);

  if (isNaN(tournamentId)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 }
    );
  }

  const deckStats = await db.tournamentDeckStats.findMany({
    where: {
      tournamentId: tournamentId,
    },
    include: {
      deck: {
        include: {
          archetype: true,
          format: true,
        },
      },
      tournament: {
        include: {
          format: true,
        },
      },
    },
    orderBy: {
      finalRank: "asc",
    },
  });

  return NextResponse.json(deckStats);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const tournamentId = parseInt(pathSegments[pathSegments.length - 2]);

  if (isNaN(tournamentId)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = UpsertTournamentDeckStatsSchema.safeParse({
    ...body,
    tournamentId,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation Error", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const { id, ...dataWithoutId } = parsed.data;

  // Check if tournament and deck exist
  const [tournament, deck] = await Promise.all([
    db.tournament.findUnique({ where: { id: tournamentId } }),
    db.deck.findUnique({ where: { id: dataWithoutId.deckId } }),
  ]);

  if (!tournament) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    );
  }

  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  const item = await db.tournamentDeckStats.upsert({
    where: {
      tournamentId_deckId: {
        tournamentId: dataWithoutId.tournamentId,
        deckId: dataWithoutId.deckId,
      },
    },
    create: dataWithoutId,
    update: {
      finalRank: dataWithoutId.finalRank,
      wins: dataWithoutId.wins,
      losses: dataWithoutId.losses,
      ties: dataWithoutId.ties,
    },
    include: {
      deck: {
        include: {
          archetype: true,
          format: true,
        },
      },
      tournament: {
        include: {
          format: true,
        },
      },
    },
  });

  return NextResponse.json({ success: true, item: item });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const tournamentId = parseInt(pathSegments[pathSegments.length - 2]);
  const { searchParams } = new URL(req.url);
  const deckId = parseInt(searchParams.get("deckId") || "");

  if (isNaN(tournamentId) || isNaN(deckId)) {
    return NextResponse.json(
      { error: "Invalid tournament ID or deck ID" },
      { status: 400 }
    );
  }

  // Check if the deck stats exist
  const deckStats = await db.tournamentDeckStats.findUnique({
    where: {
      tournamentId_deckId: {
        tournamentId,
        deckId,
      },
    },
  });

  if (!deckStats) {
    return NextResponse.json(
      { error: "Tournament deck stats not found" },
      { status: 404 }
    );
  }

  await db.tournamentDeckStats.delete({
    where: {
      tournamentId_deckId: {
        tournamentId,
        deckId,
      },
    },
  });

  return NextResponse.json({
    success: true,
    deletedTournamentId: tournamentId,
    deletedDeckId: deckId,
  });
});
