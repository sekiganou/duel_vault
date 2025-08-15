import { MatchStatus } from "@/generated/prisma";
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
  status: z.enum(MatchStatus),
  date: z.string().datetime(),
});
