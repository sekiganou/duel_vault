import z from "zod";

export const UploadObjectSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});
