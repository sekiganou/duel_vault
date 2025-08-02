# Avatar Cache System

A comprehensive local storage caching system for deck avatar URLs that maps database avatar filenames to their MinIO presigned URLs.

## Overview

The Avatar Cache System provides efficient caching of presigned URLs for deck avatars, reducing API calls to MinIO and improving performance. It uses browser localStorage to store mappings between avatar filenames and their presigned URLs with expiration timestamps.

## Features

- **Local Storage Caching**: Stores avatar URL mappings in browser localStorage
- **Automatic Expiration**: Cached URLs expire after 24 hours (configurable)
- **Bulk Operations**: Supports bulk fetching of multiple avatar URLs
- **Cache Management**: Automatic cleanup of expired entries
- **TypeScript Support**: Fully typed with Zod validation
- **SSR Safe**: Works in both client and server environments

## Components

### 1. Schema Definitions (`lib/schemas/avatarCache.ts`)

Defines the data structures and validation schemas:

```typescript
type AvatarCacheEntry = {
  filename: string;
  presignedUrl: string;
  expiresAt: number; // Unix timestamp
};

type AvatarCache = Record<string, AvatarCacheEntry>;
```

### 2. Cache Manager (`lib/api/avatarCache.ts`)

Core caching functionality with localStorage integration:

```typescript
import { avatarCache } from "@/lib/api/avatarCache";

// Set cache entry
avatarCache.set("avatar.jpg", "https://presigned-url...", 24); // 24 hours

// Get cache entry
const url = avatarCache.get("avatar.jpg"); // Returns URL or null if expired

// Delete cache entry
avatarCache.delete("avatar.jpg");

// Clear expired entries
const cleared = avatarCache.clearExpired();

// Get cache statistics
const stats = avatarCache.getStats();
```

### 3. Avatar API (`lib/api/avatarAPI.ts`)

High-level API for avatar operations:

```typescript
import { AvatarAPI, deckAvatarUtils } from "@/lib/api/avatarAPI";

// Get single presigned URL
const url = await AvatarAPI.getPresignedUrl("avatar.jpg");

// Get multiple presigned URLs
const urls = await AvatarAPI.getBulkPresignedUrls([
  "avatar1.jpg",
  "avatar2.jpg",
]);

// Process deck objects
const processedDecks = await deckAvatarUtils.processDecksAvatars(decks);
```

### 4. HTTP API Routes (`app/api/avatar-cache/route.ts`)

Server-side endpoints for avatar URL generation:

- `GET /api/avatar-cache?filename=avatar.jpg` - Get single presigned URL
- `POST /api/avatar-cache` - Get bulk presigned URLs
- `PUT /api/avatar-cache` - Force refresh presigned URL

### 5. Client-Side API (`lib/api/avatarCacheAPI.ts`)

Complete client-side interface:

```typescript
import { avatarCacheAPI } from "@/lib/api/avatarCacheAPI";

// All operations with automatic caching
const url = await avatarCacheAPI.getPresignedUrl("avatar.jpg");
const urls = await avatarCacheAPI.getBulkPresignedUrls([
  "avatar1.jpg",
  "avatar2.jpg",
]);
const processedDecks = await avatarCacheAPI.processDecksAvatars(decks);
```

## Usage Examples

### Basic Usage

```typescript
import { avatarCacheAPI } from "@/lib/api/avatarCacheAPI";

// Get a single avatar URL (uses cache if available)
const avatarUrl = await avatarCacheAPI.getPresignedUrl("deck-avatar.jpg");

// Process deck data to replace filenames with URLs
const decks = await fetchDecks();
const processedDecks = await avatarCacheAPI.processDecksAvatars(decks);
```

### Bulk Operations

```typescript
// Get multiple avatar URLs efficiently
const filenames = ["avatar1.jpg", "avatar2.jpg", "avatar3.jpg"];
const urlMap = await avatarCacheAPI.getBulkPresignedUrls(filenames);

// Use the URLs
filenames.forEach((filename) => {
  const url = urlMap.get(filename);
  if (url) {
    console.log(`${filename}: ${url}`);
  }
});
```

### Cache Management

```typescript
// Check if an avatar is cached
if (avatarCacheAPI.isCached("avatar.jpg")) {
  console.log("Avatar is cached locally");
}

// Get cache statistics
const stats = avatarCacheAPI.getCacheStats();
console.log("Cache stats:", stats);

// Clear expired entries
const cleared = avatarCacheAPI.clearExpired();
console.log(`Cleared ${cleared} expired entries`);

// Force refresh a specific avatar
const freshUrl = await avatarCacheAPI.refreshPresignedUrl("avatar.jpg");
```

### Integration with Deck Components

```typescript
import { useState, useEffect } from 'react';
import { avatarCacheAPI } from '@/lib/api/avatarCacheAPI';

function DeckList() {
  const [decks, setDecks] = useState([]);

  useEffect(() => {
    async function loadDecks() {
      // Fetch decks from API
      const response = await fetch('/api/decks');
      const rawDecks = await response.json();

      // Process avatars to get presigned URLs
      const processedDecks = await avatarCacheAPI.processDecksAvatars(rawDecks);
      setDecks(processedDecks);
    }

    loadDecks();
  }, []);

  return (
    <div>
      {decks.map(deck => (
        <div key={deck.id}>
          <h3>{deck.name}</h3>
          {deck.avatar && (
            <img src={deck.avatar} alt={`${deck.name} avatar`} />
          )}
        </div>
      ))}
    </div>
  );
}
```

## Configuration

### Cache Expiration

Default expiration is 24 hours, but can be customized:

```typescript
// Set custom expiration (in hours)
avatarCache.set("avatar.jpg", "https://url...", 12); // 12 hours
```

### Bulk Limits

The bulk API is limited to 50 files per request to prevent performance issues.

### Storage Key

Cache data is stored in localStorage under the key: `duel_vault_avatar_cache`

## Performance Benefits

1. **Reduced API Calls**: Cached URLs avoid repeated MinIO API calls
2. **Faster Loading**: Local cache provides instant access to URLs
3. **Bulk Optimization**: Single API call for multiple avatars
4. **Automatic Cleanup**: Expired entries are automatically removed

## Error Handling

The system gracefully handles various error conditions:

- **Missing Files**: Returns null for non-existent avatars
- **Network Errors**: Falls back to original filename if URL generation fails
- **Storage Errors**: Continues operation without caching if localStorage fails
- **Validation Errors**: Skips invalid entries and continues processing

## Monitoring and Debugging

### Cache Statistics

```typescript
const stats = avatarCacheAPI.getCacheStats();
console.log("Cache stats:", {
  totalEntries: stats.totalEntries,
  averageTimeToExpiry: stats.averageTimeToExpiry, // hours
  oldestEntry: new Date(stats.oldestEntry),
  newestEntry: new Date(stats.newestEntry),
});
```

### Demo Component

Use the `AvatarCacheDemo` component for testing and debugging:

```typescript
import { AvatarCacheDemo } from '@/components/AvatarCacheDemo';

// Add to any page for testing
<AvatarCacheDemo />
```

## Migration Guide

### From Direct MinIO Calls

**Before:**

```typescript
// Old way - direct MinIO calls every time
const items = await db.deck.findMany();
await Promise.all(
  items.map(async (item) => {
    if (item.avatar) {
      item.avatar = await minio.presignedGetObject(bucket, item.avatar, 86400);
    }
  })
);
```

**After:**

```typescript
// New way - uses caching
const items = await db.deck.findMany();
const processedItems = await avatarCacheAPI.processDecksAvatars(items);
```

### Server-Side Integration

The system is already integrated into the deck API routes (`/api/decks` and `/api/decks/[id]`) for optimized bulk processing.

## Security Considerations

- Presigned URLs expire after 24 hours
- Cache entries are automatically cleaned up
- No sensitive data is stored in localStorage
- Server-side validation for all requests

## Browser Compatibility

- Requires localStorage support (available in all modern browsers)
- Gracefully degrades if localStorage is not available
- Works in both development and production environments
