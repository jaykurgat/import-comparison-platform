import { Redis } from '@upstash/redis'

// Upstash's REST-based client is safe to instantiate fresh each time (it's
// just an HTTP client under the hood, not a persistent socket) but we still
// centralize it here so every part of the app reads env vars the same way,
// and so we get a clear, single error if credentials are missing.

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error(
    'Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. ' +
      'Add both to your .env file — see prisma/README.md or lib/cache/README.md for setup steps.'
  )
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})
