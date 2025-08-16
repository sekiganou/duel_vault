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

const getNumberOfMatches = (structure: TournamentStructure, partecipants: number) => {
  switch (structure) {
    case TournamentStructure.SINGLE:
      return partecipants - 1; // Single elimination: n - 1 matches for n partecipants
    case TournamentStructure.DOUBLE:
      return (partecipants - 1) * 2; // Double elimination: 2 * (n - 1) matches for n partecipants
    case TournamentStructure.DOUBLE_WITH_RESET:
      return partecipants * 2 - 1; // Double elimination with reset: 2 * n - 1 matches for n partecipants
    case TournamentStructure.GROUP_SINGLE:
      return -1;  // TODO: i have to study
    case TournamentStructure.GROUP_DOUBLE:
      return -1;  // TODO: i have to study
    default:
      return -1;
  }
}

const getNumberOfRounds = (structure: TournamentStructure, partecipants: number) => {
  switch (structure) {
    case TournamentStructure.SINGLE:
      return Math.ceil(Math.log2(partecipants)); // Single elimination: log2(n) rounds for n partecipants
    case TournamentStructure.DOUBLE:
      return Math.ceil(Math.log2(partecipants + partecipants / 2)); // Double elimination: log2(n) + 1 rounds for n partecipants
    case TournamentStructure.DOUBLE_WITH_RESET:
      return Math.ceil(Math.log2(partecipants + partecipants / 2)) + 1; // Double elimination with reset: log2(n) + 1 rounds for n partecipants
    case TournamentStructure.GROUP_SINGLE:
      return -1;  // TODO: i have to study
    case TournamentStructure.GROUP_DOUBLE:
      return -1;  // TODO: i have to study
    default:
      return -1;
  }
}

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

  await db.$transaction(async tx => {
    const tournament = await tx.tournament.create({
      data: {
        ...tournamentData,
        partecipants: tournamentData.partecipants.length,
      },
      select: {
        id: true,
        structure: true,
        partecipants: true,
      },
    });

    await tx.tournamentDeckStats.createMany({
      data: partecipants
        .map(partecipantId => ({
          tournamentId: tournament.id,
          deckId: partecipantId,
          wins: 0,
          losses: 0,
          ties: 0,
        })),
    });

    const numberOfMatches = getNumberOfMatches(tournament.structure, tournament.partecipants);

    // Create matches for the bracket
    for (let i = 0; i < numberOfMatches; i++) {
      const match = {
        tournamentId: tournament.id,
        status: MatchStatus.SCHEDULED,
        date: new Date(),
        deckAScore: 0,
        deckBScore: 0,
        deckAId: null as number | null,
        deckBId: null as number | null,
      };

      // For first round matches, assign participants
      const firstRoundMatches = Math.pow(2, Math.floor(Math.log2(tournament.partecipants)));
      if (i < firstRoundMatches && i * 2 + 1 < partecipants.length) {
        match.deckAId = partecipants[i * 2];
        match.deckBId = partecipants[i * 2 + 1];
      }

      matches.push(match);
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

    const bracketWinnerId = await tx.bracket.create({
      data: {
        tournamentId: tournament.id,
        side: BracketSide.WINNER
      },
    }).then(b => b.id);

    const numberOfRounds = getNumberOfRounds(tournament.structure, tournament.partecipants);
    const bracketNodes: { bracketId: number, matchId: number, round: number }[] = [];

    // Distribute matches across rounds properly for a tournament bracket
    if (createdMatchesId) {
      let matchIndex = 0;

      for (let round = 1; round <= numberOfRounds; round++) {
        // Calculate number of matches in this round
        // For single elimination: round 1 has most matches, each subsequent round has half
        const matchesInThisRound = Math.pow(2, numberOfRounds - round);

        for (let i = 0; i < matchesInThisRound && matchIndex < createdMatchesId.length; i++) {
          bracketNodes.push({
            matchId: createdMatchesId[matchIndex],
            bracketId: bracketWinnerId,
            round: round,
          });
          matchIndex++;
        }
      }
    }

    await tx.bracketNode.createMany({
      data: bracketNodes,
    });

    const createdBracketNodes = await tx.bracketNode.findMany({
      where: { bracketId: bracketWinnerId },
      select: { id: true, round: true },
      orderBy: [{ round: "asc" }, { id: "asc" }],
    });

    // Group nodes by round
    const nodesByRound: { [round: number]: { id: number }[] } = {};
    createdBracketNodes.forEach(node => {
      if (!nodesByRound[node.round]) {
        nodesByRound[node.round] = [];
      }
      nodesByRound[node.round].push({ id: node.id });
    });

    const bracketConnections: { fromNodeId: number, toNodeId: number }[] = [];

    // Create connections between rounds
    for (let round = 1; round < numberOfRounds; round++) {
      const currentRoundNodes = nodesByRound[round];
      const nextRoundNodes = nodesByRound[round + 1];

      if (currentRoundNodes && nextRoundNodes) {
        // Each pair of nodes in current round connects to one node in next round
        for (let i = 0; i < currentRoundNodes.length; i += 2) {
          const targetNodeIndex = Math.floor(i / 2);
          const targetNode = nextRoundNodes[targetNodeIndex];

          if (targetNode) {
            // Connect first node of the pair
            bracketConnections.push({
              fromNodeId: currentRoundNodes[i].id,
              toNodeId: targetNode.id,
            });

            // Connect second node of the pair (if it exists)
            if (currentRoundNodes[i + 1]) {
              bracketConnections.push({
                fromNodeId: currentRoundNodes[i + 1].id,
                toNodeId: targetNode.id,
              });
            }
          }
        }
      }
    }

    if (bracketConnections.length > 0) {
      await tx.bracketNodeConnection.createMany({
        data: bracketConnections,
      });
    }
  });

  return NextResponse.json({ success: true });
});
