/**
 * Generic retry wrapper for flaky/rate-limited external calls (AliExpress,
 * Jumia Seller API, etc.). Uses exponential backoff with jitter so multiple
 * concurrent retries don't all collide on the same retry schedule.
 */

export class RateLimitError extends Error {
  constructor(message = 'Rate limited by upstream API') {
    super(message)
    this.name = 'RateLimitError'
  }
}

interface RetryOptions {
  maxRetries?: number // total attempts = maxRetries + 1
  baseDelayMs?: number // delay before the first retry
  maxDelayMs?: number // cap so backoff doesn't grow unbounded
  timeoutMs?: number // per-attempt timeout, so a hung request doesn't block forever
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 8000,
  timeoutMs: 10000,
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

/**
 * Calls `fn`, retrying on failure with exponential backoff + jitter.
 * Throws the last error if all attempts are exhausted — caller is
 * responsible for deciding what to do next (e.g. fall back to stale data).
 */
export async function fetchWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs, timeoutMs } = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(fn(), timeoutMs)
    } catch (err) {
      lastError = err

      const isLastAttempt = attempt === maxRetries
      if (isLastAttempt) break

      // Exponential backoff with full jitter: random delay between 0 and the
      // computed max, so simultaneous retries spread out instead of syncing up.
      const exponentialDelay = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs)
      const jitteredDelay = Math.random() * exponentialDelay

      console.warn(
        `[fetchWithBackoff] Attempt ${attempt + 1}/${maxRetries + 1} failed: ` +
          `${err instanceof Error ? err.message : String(err)}. ` +
          `Retrying in ${Math.round(jitteredDelay)}ms.`
      )

      await sleep(jitteredDelay)
    }
  }

  throw lastError
}
