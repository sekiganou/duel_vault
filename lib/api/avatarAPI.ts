import axios from "axios";
import { getMinioClient, S3_BUCKET } from "@/s3";
import { avatarCache } from "./avatarCache";

const basePath = "/api/avatar-cache";

/**
 * Enhanced Avatar API that integrates with local storage cache
 * Maps deck avatars to presigned URLs with caching
 */
export class AvatarAPI {
  /**
   * Get presigned URL for avatar filename, using cache when possible
   */
  static async getPresignedUrl(filename: string): Promise<string | null> {
    if (!filename) return null;

    // Try to get from cache first
    const cachedUrl = avatarCache.get(filename);
    if (cachedUrl) {
      return cachedUrl;
    }

    // Not in cache or expired, generate new presigned URL
    try {
      const minio = getMinioClient();
      const bucketExists = await minio.bucketExists(S3_BUCKET);

      if (!bucketExists) return null;

      const presignedUrl = await minio.presignedGetObject(
        S3_BUCKET,
        filename,
        60 * 60 * 24 // 24 hours
      );

      // Cache the result (24 hours)
      avatarCache.set(filename, presignedUrl, 24);

      return presignedUrl;
    } catch (error) {
      console.warn(
        "Failed to generate presigned URL for avatar:",
        filename,
        error
      );
      return null;
    }
  }

  /**
   * Bulk get presigned URLs for multiple filenames
   */
  static async getBulkPresignedUrls(
    filenames: string[]
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const uncachedFilenames: string[] = [];

    // Check cache first
    for (const filename of filenames) {
      if (!filename) continue;

      const cachedUrl = avatarCache.get(filename);
      if (cachedUrl) {
        result.set(filename, cachedUrl);
      } else {
        uncachedFilenames.push(filename);
      }
    }

    // Generate presigned URLs for uncached filenames
    if (uncachedFilenames.length > 0) {
      try {
        const minio = getMinioClient();
        const bucketExists = await minio.bucketExists(S3_BUCKET);

        if (bucketExists) {
          await Promise.all(
            uncachedFilenames.map(async (filename) => {
              try {
                const presignedUrl = await minio.presignedGetObject(
                  S3_BUCKET,
                  filename,
                  60 * 60 * 24 // 24 hours
                );

                // Cache the result
                avatarCache.set(filename, presignedUrl, 24);
                result.set(filename, presignedUrl);
              } catch (error) {
                console.warn(
                  "Failed to generate presigned URL for avatar:",
                  filename,
                  error
                );
              }
            })
          );
        }
      } catch (error) {
        console.warn("Failed to check bucket existence:", error);
      }
    }

    return result;
  }

  /**
   * Invalidate cache entry for a specific avatar
   */
  static invalidateCache(filename: string): boolean {
    return avatarCache.delete(filename);
  }

  /**
   * Preload avatar URLs into cache
   */
  static async preloadAvatars(filenames: string[]): Promise<void> {
    await this.getBulkPresignedUrls(filenames);
  }

  /**
   * Clear expired cache entries
   */
  static clearExpiredCache(): number {
    return avatarCache.clearExpired();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return avatarCache.getStats();
  }

  /**
   * Clear all cached avatars
   */
  static clearAllCache(): void {
    avatarCache.clear();
  }
}

/**
 * Enhanced deck avatar utilities
 */
export const deckAvatarUtils = {
  /**
   * Process a single deck object to replace avatar filename with presigned URL
   */
  async processDecksAvatars<T extends { avatar?: string | null }>(
    decks: T[]
  ): Promise<T[]> {
    const avatarFilenames = decks
      .map((deck) => deck.avatar)
      .filter((avatar): avatar is string => Boolean(avatar));

    if (avatarFilenames.length === 0) return decks;

    const presignedUrls = await AvatarAPI.getBulkPresignedUrls(avatarFilenames);

    return decks.map((deck) => ({
      ...deck,
      avatar:
        deck.avatar && presignedUrls.has(deck.avatar)
          ? presignedUrls.get(deck.avatar)!
          : deck.avatar,
    }));
  },

  /**
   * Process a single deck object to replace avatar filename with presigned URL
   */
  async processDeckAvatar<T extends { avatar?: string | null }>(
    deck: T
  ): Promise<T> {
    if (!deck.avatar) return deck;

    const presignedUrl = await AvatarAPI.getPresignedUrl(deck.avatar);

    return {
      ...deck,
      avatar: presignedUrl || deck.avatar,
    };
  },

  /**
   * Extract filename from presigned URL (useful when you need the original filename)
   */
  extractFilename(presignedUrl: string): string | null {
    try {
      const url = new URL(presignedUrl);
      const pathParts = url.pathname.split("/");
      return pathParts[pathParts.length - 1] || null;
    } catch {
      return null;
    }
  },

  /**
   * Check if URL is a presigned URL (contains query parameters)
   */
  isPresignedUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return (
        parsed.searchParams.has("X-Amz-Algorithm") ||
        parsed.searchParams.has("AWSAccessKeyId") ||
        parsed.searchParams.has("Signature")
      );
    } catch {
      return false;
    }
  },
};
