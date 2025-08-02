import axios from "axios";
import { avatarCache } from "./avatarCache";
import { AvatarAPI, deckAvatarUtils } from "./avatarAPI";

const basePath = "/api/avatar-cache";

/**
 * Enhanced client-side avatar cache API
 */
export const avatarCacheAPI = {
  /**
   * Get presigned URL for a single avatar (uses local cache first)
   */
  async getPresignedUrl(filename: string): Promise<string | null> {
    if (!filename) return null;

    // Try local cache first
    const cached = avatarCache.get(filename);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `${basePath}?filename=${encodeURIComponent(filename)}`
      );
      const { presignedUrl, expiresAt } = response.data;

      // Cache locally
      const hoursUntilExpiry = Math.max(
        1,
        (expiresAt - Date.now()) / (60 * 60 * 1000)
      );
      avatarCache.set(filename, presignedUrl, hoursUntilExpiry);

      return presignedUrl;
    } catch (error) {
      console.warn("Failed to get presigned URL:", error);
      return null;
    }
  },

  /**
   * Get presigned URLs for multiple avatars (bulk operation)
   */
  async getBulkPresignedUrls(
    filenames: string[]
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const uncachedFilenames: string[] = [];

    // Check local cache first
    for (const filename of filenames) {
      if (!filename) continue;

      const cached = avatarCache.get(filename);
      if (cached) {
        result.set(filename, cached);
      } else {
        uncachedFilenames.push(filename);
      }
    }

    // Fetch uncached files from server
    if (uncachedFilenames.length > 0) {
      try {
        const response = await axios.post(basePath, {
          filenames: uncachedFilenames,
        });
        const { results } = response.data;

        for (const [filename, data] of Object.entries(results)) {
          if (data && typeof data === "object" && "presignedUrl" in data) {
            const { presignedUrl, expiresAt } = data as {
              presignedUrl: string;
              expiresAt: number;
            };

            // Cache locally
            const hoursUntilExpiry = Math.max(
              1,
              (expiresAt - Date.now()) / (60 * 60 * 1000)
            );
            avatarCache.set(filename, presignedUrl, hoursUntilExpiry);
            result.set(filename, presignedUrl);
          }
        }
      } catch (error) {
        console.warn("Failed to get bulk presigned URLs:", error);
      }
    }

    return result;
  },

  /**
   * Force refresh presigned URL for an avatar (invalidates cache)
   */
  async refreshPresignedUrl(filename: string): Promise<string | null> {
    if (!filename) return null;

    try {
      // Remove from local cache
      avatarCache.delete(filename);

      const response = await axios.put(basePath, { filename });
      const { presignedUrl, expiresAt } = response.data;

      // Cache locally
      const hoursUntilExpiry = Math.max(
        1,
        (expiresAt - Date.now()) / (60 * 60 * 1000)
      );
      avatarCache.set(filename, presignedUrl, hoursUntilExpiry);

      return presignedUrl;
    } catch (error) {
      console.warn("Failed to refresh presigned URL:", error);
      return null;
    }
  },

  /**
   * Process deck objects to replace avatar filenames with presigned URLs
   */
  async processDecksAvatars<T extends { avatar?: string | null }>(
    decks: T[]
  ): Promise<T[]> {
    return deckAvatarUtils.processDecksAvatars(decks);
  },

  /**
   * Process single deck object to replace avatar filename with presigned URL
   */
  async processDeckAvatar<T extends { avatar?: string | null }>(
    deck: T
  ): Promise<T> {
    return deckAvatarUtils.processDeckAvatar(deck);
  },

  /**
   * Get local cache statistics
   */
  getCacheStats() {
    return avatarCache.getStats();
  },

  /**
   * Clear expired cache entries
   */
  clearExpired(): number {
    return avatarCache.clearExpired();
  },

  /**
   * Clear all cached entries
   */
  clearAll(): void {
    avatarCache.clear();
  },

  /**
   * Check if avatar is cached locally
   */
  isCached(filename: string): boolean {
    return avatarCache.has(filename);
  },

  /**
   * Preload avatars into cache
   */
  async preload(filenames: string[]): Promise<void> {
    await this.getBulkPresignedUrls(filenames);
  },

  /**
   * Extract filename from presigned URL
   */
  extractFilename(presignedUrl: string): string | null {
    return deckAvatarUtils.extractFilename(presignedUrl);
  },

  /**
   * Check if URL is a presigned URL
   */
  isPresignedUrl(url: string): boolean {
    return deckAvatarUtils.isPresignedUrl(url);
  },
};

/**
 * Export individual components for flexibility
 */
export { avatarCache, AvatarAPI, deckAvatarUtils };
