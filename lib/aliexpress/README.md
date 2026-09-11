# AliExpress Client (Phase 2, part 2)

## What this is
The real, permanent AliExpress integration — replaces the disposable test
scripts. Fully wired into the caching layer (`withCache`): every call gets
retry/backoff, circuit breaking, stale-fallback protection, and automatic
persistence to Neon for price history.

## Files
```
lib/aliexpress/
├── sign.ts        # TOP protocol signature generator (confirmed working)
├── types.ts       # TypeScript types for the confirmed response shapes
├── client.ts       # Low-level signed request + credential loading
├── mappers.ts      # Raw AliExpress response -> internal simplified shape
├── product.ts       # getAliExpressProduct() — the main product function
├── freight.ts       # getAliExpressFreight() — the main freight function
└── README.md        # This file
```

## Prerequisites
Your `.env` needs (from earlier setup):
```
ALIEXPRESS_APP_KEY="546012"
ALIEXPRESS_APP_SECRET="..."
ALIEXPRESS_ACCESS_TOKEN="..."
ALIEXPRESS_REFRESH_TOKEN="..."
```
Plus everything from the caching layer setup (Neon + Upstash env vars).

## How to use it

```ts
import { getAliExpressProduct } from '@/lib/aliexpress/product'
import { getAliExpressFreight } from '@/lib/aliexpress/freight'

// Fetch a product (all its SKU variants), fully cached
const product = await getAliExpressProduct('1005007921636657', 'KE')
console.log(product.data.title, product.data.skus)
console.log(product.isStale) // true if this came from a fallback, not a live fetch

// Fetch freight for one specific SKU variant
const freight = await getAliExpressFreight({
  productId: '1005007921636657',
  skuId: '12000042865223892',
  shipToCountry: 'KE',
})
console.log(freight.data.options)
```

Call `getAliExpressProduct` for a product BEFORE calling
`getAliExpressFreight` for its SKUs — freight persistence needs the
`AliExpressSKU` row to already exist in Neon (it looks it up by
productId+skuId). If it doesn't exist yet, freight still returns data to
the caller, it just logs a warning and skips saving the snapshot.

## Known gaps — deliberately flagged, not silently guessed at

**1. Access token expiry (~30 days).** `ALIEXPRESS_ACCESS_TOKEN` was
obtained via the one-time OAuth flow and expires in about 30 days
(`refresh_token` in 60). There is NO automatic refresh built yet — I
deliberately did not guess at the refresh endpoint's exact parameters,
since guessing on `.calculate` vs `.query` already cost us one round of
debugging. Before the 30-day mark, either:
- Redo the OAuth flow manually (same 3 scripts as before) to get a fresh
  token pair, or
- Ask me to build proper auto-refresh once we've confirmed the refresh
  endpoint's real behavior against AliExpress's actual documentation
  (same "check the real docs first" approach that found `.query`).

**2. `estimatedTaxes` defaults to 0.** AliExpress's freight response
doesn't hand us a clean, separate tax figure for Kenya — some destinations
bake VAT into the fee (DDP), others don't, and we haven't tested a
non-free-shipping product yet to see the real shape. Real Kenyan
import-tax estimation belongs in the Landed Cost Engine phase as its own
deliberate decision, not invented here.

**3. `shipping_fee_cent` is unverified.** Our only successful freight test
was a free-shipping product, so this field has never actually appeared in
a real response we've seen — only in the documentation's example. If you
test a paid-shipping product and the resulting price looks wrong (e.g.
100x too large/small), that field's actual unit is the first thing to
check.

**4. Category mapping not wired in.** `mapProductResult` extracts
AliExpress's raw `category_id` into `rawCategoryId`, but nothing persists
it yet — `AliExpressSKU.categoryId` (the canonical FK) stays null, per the
earlier decision to populate real category data once ingestion is
underway. `rawCategoryId` is there so we don't lose the value once we do
build that mapping — it's just not saved anywhere yet.

## Testing it yourself
Run a quick manual test before wiring this into any UI:
```ts
import { getAliExpressProduct } from '@/lib/aliexpress/product'

getAliExpressProduct('1005007921636657').then((r) => console.log(JSON.stringify(r, null, 2)))
```
