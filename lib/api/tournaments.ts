import axios from "axios";
import { TournamentWithRelations } from "@/types";
import { addToast } from "@heroui/toast";

const basePath = "/api/tournaments";

export async function getAllTournaments(): Promise<TournamentWithRelations[]> {
  const res = await axios.get(basePath);
  return res.data;
}

export async function getTournamentById(
  id: number
): Promise<TournamentWithRelations> {
  const res = await axios.get(`${basePath}/${id}`);
  return res.data;
}

export async function createTournament(tournament: {
  name: string;
  formatId: number;
  startDate: string | Date;
  endDate?: string | Date;
  notes?: string;
  link?: string;
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
}) {
  try {
    const res = await axios.post(`${basePath}/${tournament.id}`, tournament);
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
