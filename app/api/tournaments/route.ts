import { db } from "@/db";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { UpsertTournamentSchema } from "@/lib/schemas/tournaments";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export const GET = withErrorHandler(async () => {
  const items = await db.tournament.findMany({
    include: {
      format: true,
      matches: {
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
          winner: {
            include: {
              archetype: true,
              format: true,
            },
          },
        },
      },
      deckStats: true,
    },
    orderBy: {
      startDate: "desc",
    },
  });

  return NextResponse.json(items);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = UpsertTournamentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation Error", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const { id, startDate, endDate, participants, ...dataWithoutId } =
    parsed.data;

  const tournamentData = {
    ...dataWithoutId,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
  };

  const ID = await db.$transaction(async (tx) => {
    const tournament = await tx.tournament.create({
      data: tournamentData,
      select: {
        id: true,
      },
    });

    await tx.tournamentDeckStats.createMany({
      data: participants.map((participant) => ({
        tournamentId: tournament.id,
        deckId: participant,
        wins: 0,
        losses: 0,
        ties: 0,
      })),
    });

    return tournament.id;
  });

  return NextResponse.json({ success: true, createdId: ID });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "");

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Check if tournament exists
  const tournament = await db.tournament.findUnique({
    where: { id },
    include: {
      matches: true,
      deckStats: true,
    },
  });

  if (!tournament) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    );
  }

  // Use transaction to ensure data consistency when deleting

  await db.tournament.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, deletedId: id });
});
