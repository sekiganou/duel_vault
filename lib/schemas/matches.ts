import z from "zod";

export const UpsertMatchSchema = z.object({
  id: z.number().nullable(),
  tournamentId: z.number().nullable(),
  deckAId: z.number(),
  deckBId: z.number(),
  winnerId: z.number().nullable(),
  deckAScore: z.number().min(0),
  deckBScore: z.number().min(0),
  notes: z.string().nullable(),
  date: z.string().datetime(),
  bracket: z
    .object({
      matchId: z.number(),
      opponent1: z.number(),
      opponent2: z.number(),
    })
    .nullable(),
});

export const DeleteMatchesSchema = z.array(z.number());
