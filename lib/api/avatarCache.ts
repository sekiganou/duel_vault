import {
  AvatarCache,
  AvatarCacheEntry,
  AvatarCacheSchema,
  SetAvatarCacheSchema,
  GetAvatarCacheSchema,
  DeleteAvatarCacheSchema,
} from "../schemas/avatarCache";

const STORAGE_KEY = "duel_vault_avatar_cache";

/**
 * Avatar Cache Manager for Local Storage
 * Maps deck avatars (filename) to their presigned URLs with expiration
 */
export class AvatarCacheManager {
  private cache: Map<string, AvatarCacheEntry>;

  constructor() {
    this.cache = new Map();
    this.loadFromStorage();
    this.cleanExpired();
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === "undefined") return; // SSR safety

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = AvatarCacheSchema.parse(JSON.parse(stored));
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn("Failed to load avatar cache from localStorage:", error);
      // Reset cache on error
      this.cache = new Map();
      this.saveToStorage();
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === "undefined") return; // SSR safety

    try {
      const cacheObject = Object.fromEntries(this.cache);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.warn("Failed to save avatar cache to localStorage:", error);
    }
  }

  /**
   * Clean expired entries from cache
   */
  private cleanExpired(): void {
    const now = Date.now();
    let hasChanges = false;

    this.cache.forEach((entry, filename) => {
      if (entry.expiresAt <= now) {
        this.cache.delete(filename);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.saveToStorage();
    }
  }

  /**
   * Set/Update an avatar cache entry
   */
  set(
    filename: string,
    presignedUrl: string,
    expirationHours: number = 24
  ): void {
    try {
      const validated = SetAvatarCacheSchema.parse({
        filename,
        presignedUrl,
        expirationHours,
      });

      const expiresAt = Date.now() + validated.expirationHours * 60 * 60 * 1000;

      this.cache.set(validated.filename, {
        filename: validated.filename,
        presignedUrl: validated.presignedUrl,
        expiresAt,
      });

      this.saveToStorage();
    } catch (error) {
      console.warn("Failed to set avatar cache entry:", error);
    }
  }

  /**
   * Get an avatar cache entry if it exists and is not expired
   */
  get(filename: string): string | null {
    try {
      const validated = GetAvatarCacheSchema.parse({ filename });
      const entry = this.cache.get(validated.filename);

      if (!entry) return null;

      // Check if expired
      if (entry.expiresAt <= Date.now()) {
        this.cache.delete(validated.filename);
        this.saveToStorage();
        return null;
      }

      return entry.presignedUrl;
    } catch (error) {
      console.warn("Failed to get avatar cache entry:", error);
      return null;
    }
  }

  /**
   * Delete a specific avatar cache entry
   */
  delete(filename: string): boolean {
    try {
      const validated = DeleteAvatarCacheSchema.parse({ filename });
      const result = this.cache.delete(validated.filename);

      if (result) {
        this.saveToStorage();
      }

      return result;
    } catch (error) {
      console.warn("Failed to delete avatar cache entry:", error);
      return false;
    }
  }

  /**
   * Check if a cache entry exists and is not expired
   */
  has(filename: string): boolean {
    return this.get(filename) !== null;
  }

  /**
   * Clear all expired entries
   */
  clearExpired(): number {
    const initialSize = this.cache.size;
    this.cleanExpired();
    return initialSize - this.cache.size;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  /**
   * Get all cached filenames
   */
  getFilenames(): string[] {
    this.cleanExpired();
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    this.cleanExpired();
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    this.cleanExpired();
    const now = Date.now();
    const entries = Array.from(this.cache.values());

    return {
      totalEntries: entries.length,
      averageTimeToExpiry:
        entries.length > 0
          ? entries.reduce((sum, entry) => sum + (entry.expiresAt - now), 0) /
            entries.length /
            (60 * 60 * 1000)
          : 0, // in hours
      oldestEntry:
        entries.length > 0
          ? Math.min(...entries.map((entry) => entry.expiresAt))
          : null,
      newestEntry:
        entries.length > 0
          ? Math.max(...entries.map((entry) => entry.expiresAt))
          : null,
    };
  }
}

// Export singleton instance
export const avatarCache = new AvatarCacheManager();
