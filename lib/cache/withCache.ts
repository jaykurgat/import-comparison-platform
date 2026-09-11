import { redis } from '../redis/client'
import { fetchWithBackoff } from './retry'
import { isCircuitOpen, recordFailure, recordSuccess } from './circuitBreaker'

/**
 * withCache — the shared caching pattern for every external API call in
 * this project (AliExpress product/freight lookups, and any future
 * external source).
 *
 * Order of operations for a single call:
 *   1. Redis cache hit?              -> return it immediately (source: "cache")
 *   2. Circuit open (API unhealthy)? -> skip straight to fallback
 *   3. Acquire a short-lived lock so only ONE concurrent request fetches
 *      fresh data; others wait briefly and reuse its result instead of
 *      all calling the upstream API at once ("stampede protection")
 *   4. Fetch fresh data with retry/backoff
 *        - success -> cache it, persist it (e.g. to a Neon snapshot table),
 *                     return it (source: "fresh")
 *        - failure -> record the failure for the circuit breaker, fall
 *                     through to fallback
 *   5. Fallback (e.g. last known price from Neon) -> return it marked
 *      isStale: true (source: "fallback") so the UI can show a staleness
 *      indicator, per the "serve last known price, but mark it stale"
 *      decision.
 *
 * If there is truly no fallback available (e.g. a brand-new product that
 * has never been successfully fetched before), this throws — there is
 * nothing honest to show the user in that case, and the caller/UI should
 * handle that as a real error state, not a silent stale value.
 */

export interface CacheResult<T> {
  data: T
  isStale: boolean
  asOf: Date
  source: 'cache' | 'fresh' | 'fallback'
}

interface CachedEnvelope<T> {
  data: T
  asOf: string // ISO date string — stored as string since Redis JSON-serializes this envelope
}

export interface WithCacheOptions<T> {
  /** Redis key this value is cached under, e.g. `aliexpress:product:12345`. */
  cacheKey: string
  /** How long a fresh value should live in cache, in seconds. */
  ttlSeconds: number
  /** Name used for circuit-breaker + logging, e.g. "aliexpress" or "jumia-seller-api". */
  serviceName: string
  /** The real, potentially slow/rate-limited call — e.g. hit the AliExpress API. */
  fetchFresh: () => Promise<T>
  /**
   * Called only when fetchFresh fails and cache is empty. Should look up the
   * last known good value (e.g. Neon's price snapshot table) and return it
   * with the timestamp it was recorded, or return null if none exists.
   */
  fetchFallback: () => Promise<{ data: T; asOf: Date } | null>
  /**
   * Optional: called after a successful fresh fetch, before returning.
   * Use this to also persist to Neon (AliExpressPriceSnapshot, etc.) so the
   * durable record and the cache are always updated together.
   */
  persistFresh?: (data: T) => Promise<void>
  lockTtlSeconds?: number
  lockWaitAttempts?: number
  lockWaitMs?: number
}

const LOCK_DEFAULTS = {
  lockTtlSeconds: 15,
  lockWaitAttempts: 5,
  lockWaitMs: 400,
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withCache<T>(options: WithCacheOptions<T>): Promise<CacheResult<T>> {
  const {
    cacheKey,
    ttlSeconds,
    serviceName,
    fetchFresh,
    fetchFallback,
    persistFresh,
    lockTtlSeconds = LOCK_DEFAULTS.lockTtlSeconds,
    lockWaitAttempts = LOCK_DEFAULTS.lockWaitAttempts,
    lockWaitMs = LOCK_DEFAULTS.lockWaitMs,
  } = options

  const lockKey = `lock:${cacheKey}`

  // 1. Cache hit — fastest path, most common case.
  const cached = await redis.get<CachedEnvelope<T>>(cacheKey)
  if (cached) {
    return { data: cached.data, isStale: false, asOf: new Date(cached.asOf), source: 'cache' }
  }

  // 2. Circuit open — upstream is known-unhealthy right now, don't bother trying.
  const circuitOpen = await isCircuitOpen(serviceName)
  if (circuitOpen) {
    console.warn(`[withCache] Circuit open for "${serviceName}" — using fallback for ${cacheKey}.`)
    return useFallback(cacheKey, fetchFallback)
  }

  // 3. Try to become the one request that fetches fresh data.
  const gotLock = await redis.set(lockKey, '1', { nx: true, ex: lockTtlSeconds })

  if (!gotLock) {
    // Someone else is already fetching. Poll briefly for them to finish
    // and populate the cache, rather than every concurrent request also
    // calling the upstream API.
    for (let attempt = 0; attempt < lockWaitAttempts; attempt++) {
      await sleep(lockWaitMs)
      const nowCached = await redis.get<CachedEnvelope<T>>(cacheKey)
      if (nowCached) {
        return {
          data: nowCached.data,
          isStale: false,
          asOf: new Date(nowCached.asOf),
          source: 'cache',
        }
      }
    }
    // The lock holder didn't finish in time (or it failed silently from our
    // point of view) — fall back rather than waiting indefinitely.
    console.warn(
      `[withCache] Timed out waiting for concurrent fetch of ${cacheKey} — using fallback.`
    )
    return useFallback(cacheKey, fetchFallback)
  }

  // 4. We hold the lock — do the real fetch.
  try {
    const data = await fetchWithBackoff(fetchFresh)
    const asOf = new Date()

    await redis.set<CachedEnvelope<T>>(cacheKey, { data, asOf: asOf.toISOString() }, {
      ex: ttlSeconds,
    })

    if (persistFresh) {
      // Persisting to Neon is important but should never block returning a
      // good result to the user if it fails — log and move on.
      try {
        await persistFresh(data)
      } catch (persistErr) {
        console.error(
          `[withCache] Fetched fresh data for ${cacheKey} but failed to persist to Neon:`,
          persistErr
        )
      }
    }

    await recordSuccess(serviceName)
    return { data, isStale: false, asOf, source: 'fresh' }
  } catch (err) {
    console.error(`[withCache] Fresh fetch failed for ${cacheKey}:`, err)
    await recordFailure(serviceName)
    return useFallback(cacheKey, fetchFallback)
  } finally {
    await redis.del(lockKey)
  }
}

async function useFallback<T>(
  cacheKey: string,
  fetchFallback: () => Promise<{ data: T; asOf: Date } | null>
): Promise<CacheResult<T>> {
  const fallback = await fetchFallback()

  if (!fallback) {
    throw new Error(
      `No cached, fresh, or fallback data available for "${cacheKey}". ` +
        `This product/rate has likely never been successfully fetched before.`
    )
  }

  return { data: fallback.data, isStale: true, asOf: fallback.asOf, source: 'fallback' }
}
