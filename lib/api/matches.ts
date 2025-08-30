import axios from "axios";
import { z } from "zod";
import { DeleteMatchesSchema, UpsertMatchSchema } from "../schemas/matches";
import { addToast } from "@heroui/toast";
import { MatchWithRelations } from "@/types";
import { getAvatarUrl } from "./avatarCache";
import { db } from "@/db";

const basePath = "/api/matches";

type PrismaTransaction = Parameters<Parameters<typeof db.$transaction>[0]>[0];

export const statusColorMap: Record<string, "primary" | "secondary"> = {
  tournament: "primary",
  friendly: "secondary",
};

export const getMatchStatus = (match: MatchWithRelations): string => {
  return match.tournament ? "tournament" : "friendly";
};

export const getStatDecrements = (
  winnerId: number | null,
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

// Shared tournament stats update logic
export const updateTournamentDeckStats = async (
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

export async function getMatchById(id: number): Promise<MatchWithRelations> {
  const res = await axios.get(`${basePath}/${id}`);
  const match: MatchWithRelations = res.data;

  if (match.deckA.avatar) {
    const presignedUrl = await getAvatarUrl(match.deckA.avatar);
    if (presignedUrl) {
      match.deckA.avatar = presignedUrl;
    }
  }
  if (match.deckB.avatar) {
    const presignedUrl = await getAvatarUrl(match.deckB.avatar);
    if (presignedUrl) {
      match.deckB.avatar = presignedUrl;
    }
  }

  return match;
}

export async function getAllMatches(): Promise<MatchWithRelations[]> {
  const res = await axios.get(basePath);
  const matches: MatchWithRelations[] = res.data;
  await Promise.all(
    matches.map(async (match) => {
      if (match.deckA.avatar) {
        const presignedUrl = await getAvatarUrl(match.deckA.avatar);
        if (presignedUrl) {
          match.deckA.avatar = presignedUrl;
        }
      }
      if (match.deckB.avatar) {
        const presignedUrl = await getAvatarUrl(match.deckB.avatar);
        if (presignedUrl) {
          match.deckB.avatar = presignedUrl;
        }
      }
    })
  );

  return matches;
}

export async function getMatchesByDeckId(
  deckAId: number,
  deckBId: number | null
) {
  const res = await axios.get(
    `${basePath}/by-deck?deckAId=${deckAId}&deckBId=${deckBId}`,
    {
      params: { deckAId, deckBId },
    }
  );
  const matches: MatchWithRelations[] = res.data;

  await Promise.all(
    matches.map(async (match) => {
      if (match.deckA.avatar) {
        const presignedUrl = await getAvatarUrl(match.deckA.avatar);
        if (presignedUrl) {
          match.deckA.avatar = presignedUrl;
        }
      }
      if (match.deckB.avatar) {
        const presignedUrl = await getAvatarUrl(match.deckB.avatar);
        if (presignedUrl) {
          match.deckB.avatar = presignedUrl;
        }
      }
    })
  );

  return matches;
}

export async function upsertMatch(match: {
  id: number | null;
  tournamentId: number | null;
  deckAId: number;
  deckBId: number;
  winnerId: number | null;
  deckAScore: number;
  deckBScore: number;
  notes: string | null;
  date: string;
}) {
  try {
    const validateMatch = UpsertMatchSchema.parse(match);

    await axios.post(basePath, validateMatch);

    addToast({
      title: `Match ${match.id ? "updated" : "created"} successfully!`,
      color: "success",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation Error:", error.message);
    } else {
      console.error("Axios or Network Error:", error);
    }
    addToast({
      title: `Failed to ${match.id ? "update" : "create"} match. Please try again`,
      color: "danger",
    });
  }
}

export async function deleteMatch(id: number) {
  try {
    await axios.delete(`${basePath}/${id}`);

    addToast({
      title: `Match deleted successfully!`,
      color: "success",
    });
  } catch (error) {
    console.error("Error deleting match:", error);
    addToast({
      title: `Failed to delete match. Please try again`,
      color: "danger",
    });
  }
}

export async function deleteMatches(ids: number[]) {
  try {
    const parsedIds = DeleteMatchesSchema.parse(ids);
    await axios.delete(`${basePath}`, { data: parsedIds });

    addToast({
      title: `Matches deleted successfully!`,
      color: "success",
    });
  } catch (error) {
    console.error("Error deleting matches:", error);
    addToast({
      title: `Failed to delete matches. Please try again`,
      color: "danger",
    });
  }
}
