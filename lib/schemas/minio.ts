import z from "zod";

export const UploadObjectSchema = z.object({
  bucket: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

export const DeleteObjectSchema = z.object({
  bucket: z.string().min(1),
  filename: z.string().min(1),
});
