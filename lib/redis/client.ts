import { Redis } from '@upstash/redis'

let client: Redis | null = null

function getRedisClient(): Redis {
  if (client) return client

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error(
      'Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. ' +
        'Add both to your .env file — see prisma/README.md or lib/cache/README.md for setup steps.'
    )
  }

  client = new Redis({ url, token })
  return client
}

/**
 * Keep Redis configuration lazy so Next.js can compile and inspect routes
 * during a production build without requiring deployment secrets at build time.
 * The first real cache operation still fails clearly if the runtime is
 * misconfigured.
 */
export const redis = new Proxy({} as Redis, {
  get(_target, property, receiver) {
    const value = Reflect.get(getRedisClient() as object, property, receiver)
    return typeof value === 'function' ? value.bind(getRedisClient()) : value
  },
})
