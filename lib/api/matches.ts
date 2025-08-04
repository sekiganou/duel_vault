import axios from "axios";
import { z } from "zod";
import { UpsertMatchSchema } from "../schemas/matches";
import { addToast } from "@heroui/toast";
import { MatchWithRelations } from "@/types";
import { getAvatarUrl } from "./avatarCache";

const basePath = "/api/matches";

export const statusColorMap: Record<string, "primary" | "secondary"> = {
  tournament: "primary",
  friendly: "secondary",
};

export function getMatchStatus(match: MatchWithRelations): string {
  return match.tournament ? "tournament" : "friendly";
}

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
    await axios.delete(`${basePath}?id=${id}`);

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
