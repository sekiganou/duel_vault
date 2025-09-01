import { ChallongeTournament } from "@/types/challonge";
import axios from "axios";

export async function getChallongeTournament(
  id: string
): Promise<ChallongeTournament> {
  const response = await axios.get(`/api/challonge/tournaments/${id}`);
  return response.data;
}

export async function getAllChallongeTournaments(): Promise<
  ChallongeTournament[]
> {
  const response = await axios.get("/api/challonge/tournaments");
  return response.data;
}
