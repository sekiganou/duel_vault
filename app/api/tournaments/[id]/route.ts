import { client } from "@/client";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { UpsertTournamentSchema } from "@/lib/schemas/tournaments";
import { NextRequest, NextResponse } from "next/server";
import { da } from "zod/v4/locales/index.cjs";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const id = parseInt(pathSegments[pathSegments.length - 1]);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 }
    );
  }

  const tournament = await client.tournament.findUnique({
    where: {
      id: id,
    },
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
        orderBy: {
          date: "desc",
        },
      },
      deckStats: {
        include: {
          deck: {
            include: {
              archetype: true,
              format: true,
            },
          },
        },
      },
    },
  });

  if (!tournament) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(tournament);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const id = parseInt(pathSegments[pathSegments.length - 1]);

  const body = await req.json();
  const parsed = UpsertTournamentSchema.omit({
    id: true,
    participants: true,
  }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid tournament data", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const updatedTournament = await client.tournament.update({
    where: { id: id },
    data: parsed.data,
  });

  return NextResponse.json(updatedTournament);
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const id = parseInt(pathSegments[pathSegments.length - 1]);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 }
    );
  }

  await client.tournament.delete({
    where: { id: id },
  });

  return NextResponse.json({ success: true, deletedId: id });
});
