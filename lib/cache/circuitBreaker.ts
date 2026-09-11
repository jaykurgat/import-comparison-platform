import { redis } from '../redis/client'

/**
 * A simple circuit breaker stored in Redis, not in-memory.
 *
 * Why Redis and not a plain in-memory counter: on Vercel, each serverless
 * invocation can be a fresh process with no shared memory. An in-memory
 * circuit breaker would reset constantly and never actually protect
 * anything. Redis gives every invocation a shared view of "is this upstream
 * API currently unhealthy?"
 *
 * Behavior: after `failureThreshold` failures within `failureWindowSeconds`,
 * the circuit "opens" for `cooldownSeconds` — during that window, callers
 * should skip calling the real API entirely and go straight to a fallback.
 */

interface CircuitBreakerOptions {
  failureThreshold?: number
  failureWindowSeconds?: number
  cooldownSeconds?: number
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  failureWindowSeconds: 60,
  cooldownSeconds: 120,
}

function failureCountKey(serviceName: string): string {
  return `circuit:${serviceName}:failures`
}

function openKey(serviceName: string): string {
  return `circuit:${serviceName}:open`
}

/** Returns true if the circuit is currently open (upstream considered unhealthy). */
export async function isCircuitOpen(serviceName: string): Promise<boolean> {
  const open = await redis.get(openKey(serviceName))
  return open !== null
}

/** Call after a successful upstream request — clears the failure count. */
export async function recordSuccess(serviceName: string): Promise<void> {
  await redis.del(failureCountKey(serviceName))
}

/**
 * Call after a failed upstream request. Trips the circuit open if the
 * failure threshold is reached within the configured window.
 */
export async function recordFailure(
  serviceName: string,
  options: CircuitBreakerOptions = {}
): Promise<void> {
  const { failureThreshold, failureWindowSeconds, cooldownSeconds } = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const key = failureCountKey(serviceName)
  const count = await redis.incr(key)

  if (count === 1) {
    // First failure in this window — set the window's expiry.
    await redis.expire(key, failureWindowSeconds)
  }

  if (count >= failureThreshold) {
    console.error(
      `[circuitBreaker] "${serviceName}" hit ${count} failures in ${failureWindowSeconds}s. ` +
        `Opening circuit for ${cooldownSeconds}s — calls will use fallback during this window.`
    )
    await redis.set(openKey(serviceName), '1', { ex: cooldownSeconds })
  }
}
