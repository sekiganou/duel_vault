import { GrandFinalType, RoundRobinMode, TournamentType } from "@/types";
import z from "zod";

export const UpsertTournamentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tournament name is required"),
  formatId: z.number("Format is required"),
  startDate: z.string().min(1, "Start date is required").or(z.date()),
  endDate: z.string().optional().or(z.date().optional()),
  notes: z.string().optional(),
  link: z.string().url().optional().or(z.literal("")),
  participants: z
    .array(z.object({ id: z.number(), name: z.string() }))
    .min(2, "At least 2 partecipants are required"),
  bracket: z.object({
    type: z.enum(TournamentType),
    settings: z.object({
      grandFinal: z.enum(GrandFinalType).optional(),
      groupCount: z.number().min(1).optional(),
      roundRobinMode: z.enum(RoundRobinMode).optional(),
      // seedOrdering: z.array(z.string()).optional(),
    }),
  }),
});

export const DeleteTournamentsSchema = z.array(z.number());
