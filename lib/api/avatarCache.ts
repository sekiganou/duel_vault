import axios from "axios";
import { avatarCache } from "../localStorage/avatarCache";

const basePath = "/api/avatar-cache";

export async function loadAvatarCache(): Promise<void> {
  try {
    const response = await axios.get(basePath);
    const avatarUrlMap: Record<string, string> = response.data;

    // Clear existing cache and load new data
    avatarCache.clearCache();
    Object.entries(avatarUrlMap).forEach(([avatarPath, presignedUrl]) => {
      avatarCache.setAvatarUrl(avatarPath, presignedUrl);
    });
  } catch (error) {
    console.error("Failed to load avatar cache:", error);
  }
}

export async function getAvatarUrl(avatarPath: string): Promise<string | null> {
  // First check cache
  const cachedUrl = avatarCache.getAvatarUrl(avatarPath);
  if (cachedUrl) {
    return cachedUrl;
  }

  // If not in cache, fetch from server
  try {
    const response = await axios.post(basePath, { avatarPath });
    const { presignedUrl } = response.data;

    // Cache the new URL
    avatarCache.setAvatarUrl(avatarPath, presignedUrl);

    return presignedUrl;
  } catch (error) {
    console.error("Failed to fetch avatar URL:", error);
    return null;
  }
}

export async function refreshAvatarUrl(
  avatarPath: string
): Promise<string | null> {
  try {
    const response = await axios.post(basePath, { avatarPath });
    const { presignedUrl } = response.data;

    // Update cache with new URL
    avatarCache.setAvatarUrl(avatarPath, presignedUrl);

    return presignedUrl;
  } catch (error) {
    console.error("Failed to refresh avatar URL:", error);
    return null;
  }
}

export { avatarCache };
