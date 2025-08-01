import axios from "axios";
import { z } from "zod";
import { UpsertMatchSchema } from "../schemas/matches";
import { addToast } from "@heroui/toast";
import { MatchWithRelations } from "@/types";

const basePath = "/api/matches";

export async function getAllMatches(): Promise<MatchWithRelations[]> {
  const res = await axios.get(basePath);
  return res.data;
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
