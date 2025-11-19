type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

export class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Sets a value in the cache.
   * @param key Cache key
   * @param data Data to store
   * @param ttlSeconds Time to live in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Gets a value from the cache.
   * Returns null if not found or expired.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }
}

export const globalCache = new InMemoryCache();

