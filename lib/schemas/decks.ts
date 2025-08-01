import z from "zod";

export const UpsertDeckSchema = z.object({
  id: z.number().nullable(),
  name: z.string().min(3, "Name must be at least 3 characters"),
  archetypeId: z.number(),
  formatId: z.number(),
  description: z.string().nullable(),
  active: z.boolean(),
  avatar: z.string().nullable(),
});
