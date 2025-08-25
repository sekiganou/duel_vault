import axios from "axios";
import { TournamentWithRelations } from "@/types";
import { addToast } from "@heroui/toast";
import { getAvatarUrl } from "./avatarCache";

const basePath = "/api/tournaments";

export async function getAllTournaments(): Promise<TournamentWithRelations[]> {
  const res = await axios.get(basePath);
  return res.data;
}

export async function getTournamentById(
  id: number
): Promise<TournamentWithRelations> {
  const res = await axios.get(`${basePath}/${id}`);
  const tournament: TournamentWithRelations = res.data;
  tournament.matches.map(async (match) => {
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
  });
  tournament.deckStats.map(async (deckStat) => {
    if (deckStat.deck.avatar) {
      const presignedUrl = await getAvatarUrl(deckStat.deck.avatar);
      if (presignedUrl) {
        deckStat.deck.avatar = presignedUrl;
      }
    }
  });
  return res.data;
}

export async function createTournament(tournament: {
  name: string;
  formatId: number;
  startDate: string | Date;
  endDate?: string | Date;
  notes?: string;
  link?: string;
  participants: Array<number>;
}) {
  try {
    const res = await axios.post(basePath, tournament);
    addToast({
      title: "Tournament created successfully",
      color: "success",
    });
    return res.data;
  } catch (error) {
    addToast({
      title: "Failed to create tournament. Please try again.",
      color: "danger",
    });
    console.error("Error creating tournament:", error);
  }
}

export async function updateTournament(tournament: {
  id: string;
  name: string;
  formatId: number;
  startDate: string | Date;
  endDate?: string | Date;
  notes?: string;
  link?: string;
  participants: Array<number>;
}) {
  try {
    const { participants, ...data } = tournament;
    const res = await axios.post(`${basePath}/${tournament.id}`, data);
    addToast({
      title: "Tournament updated successfully",
      color: "success",
    });
    return res.data;
  } catch (error) {
    addToast({
      title: "Failed to update tournament. Please try again.",
      color: "danger",
    });
    console.error("Error updating tournament:", error);
  }
}

export async function deleteTournament(id: number) {
  try {
    const res = await axios.delete(`${basePath}/${id}`);
    addToast({
      title: "Tournament deleted successfully",
      color: "success",
    });
    return res.data;
  } catch (error) {
    addToast({
      title: "Failed to delete tournament. Please try again.",
      color: "danger",
    });
    console.error("Error deleting tournament:", error);
  }
}
