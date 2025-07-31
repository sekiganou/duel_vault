import z from "zod";

export const CreateDeckSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  formatId: z.number(),
  archetypeId: z.number(),
  description: z.string().nullable(),
});
