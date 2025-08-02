import z from "zod";

export const AvatarCacheEntrySchema = z.object({
  filename: z.string().min(1),
  presignedUrl: z.string().url(),
  expiresAt: z.number(), // Unix timestamp
});

export const AvatarCacheSchema = z.record(z.string(), AvatarCacheEntrySchema);

export type AvatarCacheEntry = z.infer<typeof AvatarCacheEntrySchema>;
export type AvatarCache = z.infer<typeof AvatarCacheSchema>;

export const SetAvatarCacheSchema = z.object({
  filename: z.string().min(1),
  presignedUrl: z.string().url(),
  expirationHours: z.number().min(1).max(168).default(24), // Default 24 hours, max 1 week
});

export const GetAvatarCacheSchema = z.object({
  filename: z.string().min(1),
});

export const DeleteAvatarCacheSchema = z.object({
  filename: z.string().min(1),
});

export const ClearExpiredCacheSchema = z.object({
  // No parameters needed - clears all expired entries
});
