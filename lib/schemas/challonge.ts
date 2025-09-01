import z from "zod";

export const CreateChallongeTournamentSchema = z.object({
  name: z.string().max(60),
  tournament_type: z.string(),
  description: z.string().optional(),
  ranked_by: z.string(),
});
