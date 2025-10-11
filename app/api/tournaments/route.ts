import { client } from "@/client";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import {
  DeleteTournamentsSchema,
  UpsertTournamentSchema,
} from "@/lib/schemas/tournaments";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { JsonDatabase } from "brackets-json-db";
import { BracketsManager } from "brackets-manager";

export const GET = withErrorHandler(async () => {
  const items = await client.tournament.findMany({
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

  const ID = await client.$transaction(async (tx) => {
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

    const storage = new JsonDatabase();
    const manager = new BracketsManager(storage);

    const name = "Example stage";

    await manager.create.stage({
      name: name,
      tournamentId: tournament.id, //
      type: "single_elimination",
      seeding: participants.map((deckId) => "Team " + deckId),
    });

    return tournament.id;
  });

  return NextResponse.json({ success: true, createdId: ID });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = DeleteTournamentsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid ID(s)", details: parsed.error },
      { status: 400 }
    );
  }

  const ids = parsed.data;

  await client.tournament.deleteMany({
    where: { id: { in: ids } },
  });

  return NextResponse.json({ success: true, IDS: ids });
});
