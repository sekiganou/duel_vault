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

  const { id, startDate, endDate, ...dataWithoutId } = parsed.data;
  const tournamentData = {
    ...dataWithoutId,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
  };

  const item = await db.tournament.upsert({
    where: { id: id ? parseInt(id) : -1 },
    create: tournamentData,
    update: tournamentData,
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
  });

  return NextResponse.json({ success: true, item: item });
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
  await db.$transaction(async (tx) => {
    // Delete tournament deck stats first (due to foreign key constraints)
    await tx.tournamentDeckStats.deleteMany({
      where: { tournamentId: id },
    });

    // Update matches to remove tournament reference (set tournamentId to null)
    // This preserves match history while removing tournament association
    await tx.match.updateMany({
      where: { tournamentId: id },
      data: { tournamentId: null },
    });

    // Finally delete the tournament
    await tx.tournament.delete({
      where: { id },
    });
  });

  return NextResponse.json({ success: true, deletedId: id });
});
