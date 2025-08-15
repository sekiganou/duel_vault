import { db } from "@/db";
import { Bracket, BracketSide, MatchStatus, TournamentStructure } from "@/generated/prisma";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { UpsertTournamentSchema } from "@/lib/schemas/tournaments";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import "@/lib/extensions/array";

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

// Create a new tournament
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

  const partecipants = tournamentData.partecipants.map((p) => Number(p)).shuffle();

  const matches: {
    tournamentId: number,
    deckAId: number | null,
    deckBId: number | null,
    status: MatchStatus,
    date: Date,
    deckAScore: number,
    deckBScore: number
  }[] = [];

  // TODO: create a function to generate matches based on the tournament structure

  await db.$transaction(async tx => {
    const tournament = await tx.tournament.create({
      data: {
        ...tournamentData,
        partecipants: tournamentData.partecipants.length,
      },
      select: {
        id: true,
        structure: true,
      },
    });

    partecipants.forEach((deckId, index) => {
      if (index % 2 === 0 && index + 1 < partecipants.length) {
        matches.push({
          tournamentId: tournament.id,
          deckAId: deckId,
          deckBId: partecipants[index + 1],
          status: MatchStatus.SCHEDULED,
          date: new Date(),
          deckAScore: 0,
          deckBScore: 0,
        });
      }
    });

    for (let i = 0; i < partecipants.length; i++) {
      matches.push({
        tournamentId: tournament.id,
        deckAId: null,
        deckBId: null,
        status: MatchStatus.SCHEDULED,
        date: new Date(),
        deckAScore: 0,
        deckBScore: 0,
      });
    }

    await tx.match.createMany({
      data: matches,
    });

    const createdMatchesId = await tx.tournament.findUnique({
      where: { id: tournament.id },
      include: {
        matches: {
          select: {
            id: true,
          },
        },
      },
    }).then(t => t && t.matches.map(m => m.id));

    await tx.tournamentDeckStats.createMany({
      data: partecipants
        .map(partecipant => ({
          tournamentId: tournament.id,
          deckId: partecipant,
          wins: 0,
          losses: 0,
          ties: 0,
        })),
    });

    const bracketWinnerId = await tx.bracket.create({
      data: {
        tournamentId: tournament.id,
        side: BracketSide.WINNER
      },
    }).then(b => b.id);
    // let bracketLoserId: number | null;
    // if (tournament.structure === TournamentStructure.DOUBLE) {
    //   bracketLoserId = await tx.bracket.create({
    //     data: {
    //       tournamentId: tournament.id,
    //       side: BracketSide.LOSER
    //     },
    //   }).then(b => b.id);
    // }


    const bracketNodes: { bracketId: number, matchId: number, round: number }[] = [];
    createdMatchesId?.forEach((id, index) =>
      bracketNodes.push({
        matchId: id,
        bracketId: bracketWinnerId,
        round: index + 1,
      }))

    await tx.bracketNode.createMany({
      data: bracketNodes,
    });

    const createdBracketNodes = await tx.bracketNode.findMany({
      where: { bracketId: bracketWinnerId },
      select: { id: true, round: true },
      orderBy: { round: "asc" },
    })

    const bracketConnections: { fromNodeId: number, toNodeId: number }[] = [];
    for (let i = 0; i < createdBracketNodes.length; i++) {
      if (i < partecipants.length)
        bracketConnections.push({
          fromNodeId: createdBracketNodes[i].id,
          toNodeId: createdBracketNodes
            .find((node) => node.round === createdBracketNodes[i].round + 1)?.id || createdBracketNodes[i].id
        })
      else
        bracketConnections.push({
          fromNodeId: createdBracketNodes[i].id,
          toNodeId: createdBracketNodes
            .find((node) => node.round === createdBracketNodes[i].round + partecipants.length)?.id || createdBracketNodes[i].id
        });
    }

    await tx.bracketNodeConnection.createMany({
      data: bracketConnections,
    });
  });

  return NextResponse.json({ success: true });
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
    // await tx.tournamentDeckStats.deleteMany({
    //   where: { tournamentId: id },
    // });

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
