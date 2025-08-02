import z from "zod";

export const UpsertTournamentDeckStatsSchema = z.object({
  id: z.string().optional(),
  tournamentId: z.number().positive("Tournament ID is required"),
  deckId: z.number().positive("Deck ID is required"),
  finalRank: z.number().positive("Final rank is required"),
  wins: z.number().min(0, "Wins cannot be negative"),
  losses: z.number().min(0, "Losses cannot be negative"),
  ties: z.number().min(0, "Ties cannot be negative"),
});