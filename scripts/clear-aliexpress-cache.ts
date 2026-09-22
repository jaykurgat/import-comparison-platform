import 'dotenv/config'
import { redis } from '../lib/redis/client'

/**
 * After `prisma migrate reset`, Neon is empty but Redis still has cached
 * AliExpress product/freight data from before. Without clearing it,
 * getAliExpressProduct/getAliExpressFreight would return a CACHE HIT and
 * skip persistFresh entirely — meaning AliExpressSKU would never get
 * re-populated in the fresh database. This clears exactly the keys used
 * by the test data so far, forcing a real re-fetch next time.
 */

const KEYS_TO_CLEAR = [
  'aliexpress:product:1005007921636657:KE',
  'aliexpress:freight:1005007921636657:12000042865223892:KE:1:USD',
]

async function main() {
  for (const key of KEYS_TO_CLEAR) {
    const deleted = await redis.del(key)
    console.log(`${key}: ${deleted ? 'cleared' : 'was not set'}`)
  }
}

main().catch((err) => {
  console.error('Failed to clear cache:', err)
  process.exit(1)
})
