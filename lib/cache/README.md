# Caching Layer (Phase 2, part 1)

## What this is
The shared caching pattern every external API call in LandedCompare will use
(AliExpress product/freight lookups first, Jumia Seller API later if needed).
It implements the "serve last known price, mark it stale" decision, plus
protection against the failure modes we discussed: API outages, rate limits,
and cache-stampede (many users hitting an expired cache key at once).

## Files
```
lib/
├── prisma.ts              # Prisma client singleton (safe for serverless)
├── redis/
│   └── client.ts           # Upstash Redis client, reads env vars
└── cache/
    ├── retry.ts             # Exponential backoff + jitter + per-attempt timeout
    ├── circuitBreaker.ts    # Redis-backed circuit breaker (shared across serverless instances)
    ├── withCache.ts         # Main orchestrator — use this one in your API code
    └── README.md            # This file
```

## Prerequisites
Your `.env` needs (from the Neon and Upstash setup steps):
```
DATABASE_URL="..."
DIRECT_URL="..."
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

Install the one new dependency this adds (if you haven't already):
```bash
npm install @upstash/redis
```

## Schema change required
This added two fields to `ComparisonResult` in `schema.prisma`:
`priceDataAsOf` and `isStale`. Run a new migration to apply it:
```bash
npx prisma migrate dev --name add_staleness_tracking
```
Since your `ComparisonResult` table is currently empty, this migration is
safe to run with no data-loss concerns. If you ever run this after real data
exists, you'd need to backfill `priceDataAsOf` first — not a concern yet.

## How to use `withCache`
This is the one function you'll actually call. Example — fetching an
AliExpress product with full protection:

```ts
import { withCache } from '@/lib/cache/withCache'
import { prisma } from '@/lib/prisma'

async function getAliExpressProduct(productId: string, skuId: string) {
  const result = await withCache({
    cacheKey: `aliexpress:product:${productId}:${skuId}`,
    ttlSeconds: 60 * 60 * 18, // 18h, within your 12-24h spec
    serviceName: 'aliexpress',

    // The real API call — this is the only part that changes per-endpoint.
    fetchFresh: async () => {
      return callAliExpressProductApi(productId, skuId) // you'll build this in the API client
    },

    // Called only if fetchFresh fails AND there's no cache — reads the last
    // known good value from Neon so we're never fully stuck.
    fetchFallback: async () => {
      const last = await prisma.aliExpressPriceSnapshot.findFirst({
        where: { aliExpressSku: { productId, skuId } },
        orderBy: { recordedAt: 'desc' },
      })
      if (!last) return null
      return { data: last, asOf: last.recordedAt }
    },

    // Optional — also writes every fresh fetch into Neon's snapshot table,
    // so price history builds up automatically.
    persistFresh: async (data) => {
      await prisma.aliExpressPriceSnapshot.create({
        data: { aliExpressSkuId: data.id, itemPrice: data.itemPrice },
      })
    },
  })

  // result.data        -> the actual product data
  // result.isStale      -> true if this came from fallback, not a live fetch
  // result.asOf         -> when this data was actually valid as of
  // result.source       -> 'cache' | 'fresh' | 'fallback', useful for logging/debugging
  return result
}
```

## What happens automatically, per failure mode
- **Redis has it cached** → returned instantly, no API call at all.
- **Cache expired, first request in** → fetches fresh (with retry/backoff on
  failure), caches it, returns it.
- **Cache expired, 50 requests arrive at once** → only ONE actually calls
  AliExpress; the other 49 wait briefly and reuse its result. If it takes
  too long, they fall back instead of waiting forever.
- **AliExpress is down/rate-limited repeatedly** → after 5 failures in 60
  seconds, the circuit "opens" for 2 minutes — during that window, every
  request skips straight to fallback instead of retrying a known-broken API.
- **No fallback exists either** (brand-new product, never fetched before) →
  throws a clear error. This is the one case where there's genuinely nothing
  honest to show — your API route should catch this and return a real error
  state to the UI, not a fake price.

## Testing it yourself
Once you have Upstash + Neon both connected, you can test the caching
behavior directly (before we build the real AliExpress client) with a fake
`fetchFresh` that sometimes throws, to confirm retries/fallback work. Ask me
for a quick test script if you want to see it run before we wire in real
AliExpress calls.
