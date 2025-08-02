import axios from "axios";
import { TournamentDeckStats } from "@/generated/prisma";

export async function getTournamentDeckStats(
  tournamentId: number
): Promise<TournamentDeckStats[]> {
  const res = await axios.get(`/api/tournaments/${tournamentId}/deck-stats`);
  return res.data;
}

export async function createTournamentDeckStats(
  tournamentId: number,
  deckStats: {
    deckId: number;
    finalRank: number;
    wins: number;
    losses: number;
    ties: number;
  }
): Promise<{ success: boolean; item: TournamentDeckStats }> {
  const res = await axios.post(
    `/api/tournaments/${tournamentId}/deck-stats`,
    deckStats
  );
  return res.data;
}

export async function updateTournamentDeckStats(
  tournamentId: number,
  deckStats: {
    id: string;
    deckId: number;
    finalRank: number;
    wins: number;
    losses: number;
    ties: number;
  }
): Promise<{ success: boolean; item: TournamentDeckStats }> {
  const res = await axios.post(
    `/api/tournaments/${tournamentId}/deck-stats`,
    deckStats
  );
  return res.data;
}

export async function deleteTournamentDeckStats(
  tournamentId: number,
  deckId: number
): Promise<{
  success: boolean;
  deletedTournamentId: number;
  deletedDeckId: number;
}> {
  const res = await axios.delete(
    `/api/tournaments/${tournamentId}/deck-stats?deckId=${deckId}`
  );
  return res.data;
}
