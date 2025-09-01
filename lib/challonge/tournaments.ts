import { ChallongeTournament } from "@/types/challonge";
import axios from "axios";

export async function getAllChallongeTournaments(): Promise<
  ChallongeTournament[]
> {
  const response = await axios.get("/api/challonge/tournaments");
  return response.data;
}
