interface AvatarCacheAPI {
  setAvatarUrl(avatarPath: string, presignedUrl: string): void;
  getAvatarUrl(avatarPath: string): string | null;
  getAllAvatarUrls(): Map<string, string>;
  clearCache(): void;
  hasCachedUrl(avatarPath: string): boolean;
}

class AvatarCache implements AvatarCacheAPI {
  private cache: Map<string, string> = new Map();

  setAvatarUrl(avatarPath: string, presignedUrl: string): void {
    this.cache.set(avatarPath, presignedUrl);
  }

  getAvatarUrl(avatarPath: string): string | null {
    return this.cache.get(avatarPath) || null;
  }

  getAllAvatarUrls(): Map<string, string> {
    return new Map(this.cache);
  }

  clearCache(): void {
    this.cache.clear();
  }

  hasCachedUrl(avatarPath: string): boolean {
    return this.cache.has(avatarPath);
  }
}

export const avatarCache = new AvatarCache();
