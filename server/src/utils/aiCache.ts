import crypto from 'crypto';

interface CacheEntry {
  value: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

const defaultTtl = Number(process.env.AI_CACHE_TTL_SECONDS) || 300;

/** Create a unique cache key based on the endpoint and body payload */
export function createCacheKey(endpoint: string, input: any): string {
  // Sort keys in input to make sure order doesn't affect key generation
  const sortedInput = sortObjectKeys(input);
  const hash = crypto.createHash('sha256').update(JSON.stringify(sortedInput)).digest('hex');
  return `${endpoint}:${hash}`;
}

/** Get cached value if not expired */
export function getCache(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

/** Save value to cache with a TTL (seconds) */
export function setCache(key: string, value: any, ttlSeconds: number = defaultTtl): void {
  // Perform cleanup of expired items periodically on set
  clearExpiredCache();

  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/** Remove all expired cache entries */
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}

function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sorted: any = {};
  Object.keys(obj).sort().forEach((key) => {
    sorted[key] = sortObjectKeys(obj[key]);
  });
  return sorted;
}
