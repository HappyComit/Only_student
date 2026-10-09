/**
 * apiCache.ts — Stale-While-Revalidate cache for CampusHive
 *
 * Eliminates redundant network calls across tab switches and screen mounts.
 * Every cached key returns instantly from memory on subsequent reads, while
 * silently revalidating in the background when stale.
 *
 * Features:
 * - In-memory Map for O(1) lookups (no AsyncStorage overhead)
 * - Configurable TTL per key (default 60s)
 * - Request deduplication: concurrent calls to the same key share one fetch
 * - `clearAll()` for logout cleanup
 * - `forceRefresh()` bypasses cache entirely for pull-to-refresh
 */

import { apiFetch } from './api';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-memory cache store
const cache = new Map<string, CacheEntry>();

// In-flight request deduplication
const inflight = new Map<string, Promise<any>>();

// Default TTL: 60 seconds
const DEFAULT_TTL = 60_000;

/**
 * Fetch with stale-while-revalidate semantics.
 *
 * 1. If cached data exists and is NOT stale → return immediately (no network).
 * 2. If cached data exists but IS stale → return immediately, revalidate in background.
 * 3. If no cached data → fetch from network, cache, and return.
 *
 * @param path  - API path (e.g. '/auth/profile')
 * @param opts  - Optional: { ttl, options (RequestInit), forceRefresh }
 */
export async function cachedFetch<T = any>(
  path: string,
  opts?: {
    ttl?: number;
    options?: RequestInit;
    forceRefresh?: boolean;
  },
): Promise<T> {
  const ttl = opts?.ttl ?? DEFAULT_TTL;
  const forceRefresh = opts?.forceRefresh ?? false;
  const cacheKey = buildCacheKey(path, opts?.options);

  // If forced refresh, skip cache entirely
  if (!forceRefresh) {
    const entry = cache.get(cacheKey);
    if (entry) {
      const age = Date.now() - entry.timestamp;
      if (age < entry.ttl) {
        // Fresh cache hit — return immediately
        return entry.data as T;
      }
      // Stale cache hit — return stale data immediately, revalidate in background
      revalidateInBackground(path, cacheKey, ttl, opts?.options);
      return entry.data as T;
    }
  }

  // No cache or forced refresh — do a real fetch (with dedup)
  return dedupedFetch<T>(path, cacheKey, ttl, opts?.options);
}

/**
 * Pre-populate cache from data you already have (e.g. from a parallel fetch).
 */
export function setCacheEntry<T>(path: string, data: T, ttl: number = DEFAULT_TTL): void {
  const cacheKey = buildCacheKey(path);
  cache.set(cacheKey, { data, timestamp: Date.now(), ttl });
}

/**
 * Read cached data without triggering any network call.
 * Returns undefined if no cache entry exists.
 */
export function getCacheEntry<T>(path: string): T | undefined {
  const entry = cache.get(buildCacheKey(path));
  return entry?.data as T | undefined;
}

/**
 * Invalidate a specific cache entry.
 */
export function invalidateCache(path: string): void {
  cache.delete(buildCacheKey(path));
}

/**
 * Clear the entire cache — call on logout.
 */
export function clearAllCache(): void {
  cache.clear();
  inflight.clear();
}

// ── Internal helpers ─────────────────────────────────────────────

function buildCacheKey(path: string, options?: RequestInit): string {
  // Only cache GET requests (default method when no options or method is GET/undefined)
  const method = options?.method?.toUpperCase() || 'GET';
  return `${method}:${path}`;
}

async function dedupedFetch<T>(
  path: string,
  cacheKey: string,
  ttl: number,
  options?: RequestInit,
): Promise<T> {
  // If there's already an in-flight request for this key, piggyback on it
  const existing = inflight.get(cacheKey);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = apiFetch<T>(path, options)
    .then((data) => {
      cache.set(cacheKey, { data, timestamp: Date.now(), ttl });
      inflight.delete(cacheKey);
      return data;
    })
    .catch((err) => {
      inflight.delete(cacheKey);
      throw err;
    });

  inflight.set(cacheKey, promise);
  return promise;
}

function revalidateInBackground(
  path: string,
  cacheKey: string,
  ttl: number,
  options?: RequestInit,
): void {
  // Don't kick off another background refresh if one is already in flight
  if (inflight.has(cacheKey)) return;

  const promise = apiFetch(path, options)
    .then((data) => {
      cache.set(cacheKey, { data, timestamp: Date.now(), ttl });
      inflight.delete(cacheKey);
    })
    .catch(() => {
      // Silently ignore background revalidation errors — stale data is better than no data
      inflight.delete(cacheKey);
    });

  inflight.set(cacheKey, promise);
}
