import z from "zod";

export const UpsertArchetypeSchema = z.object({
  name: z.string().min(1, "Name must be at least a character"),
});
