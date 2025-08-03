"use client";

import { useEffect } from "react";
import { loadAvatarCache } from "@/lib/api/avatarCache";

export function AvatarCacheInitializer() {
  useEffect(() => {
    // Load avatar cache on app start
    loadAvatarCache().catch((error) => {
      console.error("Failed to initialize avatar cache:", error);
    });
  }, []);

  return null; // This component doesn't render anything
}
