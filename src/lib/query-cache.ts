// Simple in-memory cache for database queries
// In production, consider using Redis or a more sophisticated caching solution

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate cache key for zippclips queries
  static getZippclipsKey(filters: {
    userId?: string;
    followingIds?: string[];
    limit?: number;
    offset?: number;
  } = {}): string {
    return `zippclips:${JSON.stringify(filters)}`;
  }

  // Generate cache key for user profile
  static getUserProfileKey(userId: string): string {
    return `user_profile:${userId}`;
  }

  // Generate cache key for social counts
  static getSocialCountsKey(zippclipId: string): string {
    return `social_counts:${zippclipId}`;
  }

  // Generate cache key for conversations
  static getConversationsKey(userId: string): string {
    return `conversations:${userId}`;
  }
}

export const queryCache = new QueryCache();

// Cache wrapper for async functions
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = queryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Cache the result
  queryCache.set(key, data, ttl);
  
  return data;
}

// Invalidate cache entries by pattern
export function invalidateCache(pattern: string): void {
  const keys = Array.from(queryCache['cache'].keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      queryCache.delete(key);
    }
  });
}
