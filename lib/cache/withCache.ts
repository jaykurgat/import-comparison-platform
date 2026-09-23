import { redis } from '../redis/client'
import { fetchWithBackoff } from './retry'
import { isCircuitOpen, recordFailure, recordSuccess } from './circuitBreaker'

export interface CacheResult<T> {
  data: T
  isStale: boolean
  asOf: Date
  source: 'cache' | 'fresh' | 'fallback'
}

interface CachedEnvelope<T> {
  data: T
  asOf: string
}

export interface WithCacheOptions<T> {
  cacheKey: string
  ttlSeconds: number
  serviceName: string
  fetchFresh: () => Promise<T>
  fetchFallback: () => Promise<{ data: T; asOf: Date } | null>
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
  const lockToken = crypto.randomUUID()

  const cached = await redis.get<CachedEnvelope<T>>(cacheKey)
  if (cached) {
    return { data: cached.data, isStale: false, asOf: new Date(cached.asOf), source: 'cache' }
  }

  const circuitOpen = await isCircuitOpen(serviceName)
  if (circuitOpen) {
    console.warn(`[withCache] Circuit open for "${serviceName}" — using fallback for ${cacheKey}.`)
    return resolveFallback(cacheKey, fetchFallback)
  }

  const gotLock = await redis.set(lockKey, lockToken, { nx: true, ex: lockTtlSeconds })

  if (!gotLock) {
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
    console.warn(`[withCache] Timed out waiting for concurrent fetch of ${cacheKey} — using fallback.`)
    return resolveFallback(cacheKey, fetchFallback)
  }

  try {
    const data = await fetchWithBackoff(fetchFresh)
    const asOf = new Date()

    await redis.set<CachedEnvelope<T>>(cacheKey, { data, asOf: asOf.toISOString() }, { ex: ttlSeconds })

    if (persistFresh) {
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
    return resolveFallback(cacheKey, fetchFallback)
  } finally {
    try {
      await redis.eval(
        `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
        [lockKey],
        [lockToken]
      )
    } catch (releaseErr) {
      console.error(`[withCache] Failed to release lock ${lockKey} safely:`, releaseErr)
    }
  }
}

async function resolveFallback<T>(
  cacheKey: string,
  fetchFallback: () => Promise<{ data: T; asOf: Date } | null>
): Promise<CacheResult<T>> {
  const fallback = await fetchFallback()

  if (!fallback) {
    throw new Error(
      `No cached, fresh, or fallback data available for "${cacheKey}". This product/rate has likely never been successfully fetched before.`
    )
  }

  return { data: fallback.data, isStale: true, asOf: fallback.asOf, source: 'fallback' }
}
