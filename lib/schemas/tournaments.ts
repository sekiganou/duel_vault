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
    .array(z.number())
    .min(2, "At least 2 partecipants are required"),
});

export const DeleteTournamentsSchema = z.array(z.number());
