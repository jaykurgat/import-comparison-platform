import { prisma } from '../prisma'
import { withCache, type CacheResult } from '../cache/withCache'
import { callAliExpressSync, getAliExpressCredentials } from './client'
import type { AliExpressFreightQueryResponse } from './types'
import type { MappedFreightOption, MappedFreightQuote } from './mappers'

const FREIGHT_TTL_SECONDS = 9 * 60 * 60 // 9h — within the 6-12h spec

interface FreightQueryArgs {
  productId: string
  skuId: string
  shipToCountry?: string
  quantity?: number
  currency?: string
}

/**
 * Fetches shipping/delivery options for a specific product+SKU+destination.
 *
 * KNOWN GAPS, flagged deliberately rather than guessed at:
 * 1. `shipping_fee_cent` — confirmed field name from docs, but our only
 *    successful test was a free-shipping product, so this field was never
 *    actually present in a response we've seen. The docs' own example value
 *    ("172.71") doesn't look like cents despite the field name. Parsed as
 *    a plain decimal for now — VERIFY with a real paid-shipping product
 *    before trusting this in production.
 * 2. `estimatedTaxes` — AliExpress's freight.query response has no distinct
 *    tax figure for KE in what we've seen (some destinations show DDP/VAT
 *    already included in the fee, others don't). Defaulting to 0 here.
 *    Real Kenyan import tax/duty estimation is a Landed Cost Engine
 *    decision, not something this client should invent.
 */
export async function getAliExpressFreight({
  productId,
  skuId,
  shipToCountry = 'KE',
  quantity = 1,
  currency = 'USD',
}: FreightQueryArgs): Promise<CacheResult<MappedFreightQuote>> {
  const cacheKey = `aliexpress:freight:${productId}:${skuId}:${shipToCountry}:${quantity}:${currency}`

  return withCache<MappedFreightQuote>({
    cacheKey,
    ttlSeconds: FREIGHT_TTL_SECONDS,
    serviceName: 'aliexpress',

    fetchFresh: async () => {
      const credentials = getAliExpressCredentials()

      const queryDeliveryReq = JSON.stringify({
        quantity: String(quantity),
        shipToCountry,
        productId,
        selectedSkuId: skuId,
        language: 'en_US',
        locale: 'zh_CN', // as shown in AliExpress's own demo code
        currency,
      })

      const response = await callAliExpressSync<AliExpressFreightQueryResponse>(
        'aliexpress.ds.freight.query',
        { queryDeliveryReq },
        credentials
      )

      const result = response.aliexpress_ds_freight_query_response?.result
      if (!result || !result.success) {
        throw new Error(
          `Freight query failed for product ${productId}/sku ${skuId}: ${result?.msg ?? 'no result'}`
        )
      }

      const rawOptions = result.delivery_options?.delivery_option_d_t_o ?? []
      const options: MappedFreightOption[] = rawOptions.map((opt) => ({
        code: opt.code,
        freeShipping: opt.free_shipping,
        freightCost: opt.free_shipping ? 0 : Number(opt.shipping_fee_cent ?? 0),
        currency: opt.shipping_fee_currency ?? currency,
        minDays: opt.min_delivery_days,
        maxDays: opt.max_delivery_days,
        company: opt.company,
        shipFromCountry: opt.ship_from_country,
        tracking: opt.tracking,
      }))

      return { destination: shipToCountry, options }
    },

    fetchFallback: async () => fetchFreightFallback(productId, skuId, shipToCountry),

    persistFresh: async (data) => persistFreight(productId, skuId, data),
  })
}

async function fetchFreightFallback(
  productId: string,
  skuId: string,
  destination: string
): Promise<{ data: MappedFreightQuote; asOf: Date } | null> {
  const aliExpressSku = await prisma.aliExpressSKU.findUnique({
    where: { productId_skuId: { productId, skuId } },
  })
  if (!aliExpressSku) return null

  const lastSnapshot = await prisma.freightSnapshot.findFirst({
    where: { aliExpressSkuId: aliExpressSku.id, destination },
    orderBy: { recordedAt: 'desc' },
  })
  if (!lastSnapshot) return null

  return {
    data: {
      destination,
      options: [
        {
          code: 'FALLBACK',
          freeShipping: Number(lastSnapshot.freightCost) === 0,
          freightCost: Number(lastSnapshot.freightCost),
          currency: lastSnapshot.currency,
          minDays: lastSnapshot.etaMinDays,
          maxDays: lastSnapshot.etaMaxDays,
          company: 'Last known quote',
          shipFromCountry: '',
          tracking: false,
        },
      ],
    },
    asOf: lastSnapshot.recordedAt,
  }
}

/**
 * Persists the cheapest/first delivery option as the canonical freight
 * snapshot. Requires the AliExpressSKU to already exist (i.e. product.get
 * must have been called and persisted for this SKU first) — if it hasn't,
 * this logs a warning and skips rather than creating an incomplete/orphaned
 * record.
 */
async function persistFreight(productId: string, skuId: string, data: MappedFreightQuote): Promise<void> {
  if (data.options.length === 0) return

  const aliExpressSku = await prisma.aliExpressSKU.findUnique({
    where: { productId_skuId: { productId, skuId } },
  })

  if (!aliExpressSku) {
    console.warn(
      `[persistFreight] No AliExpressSKU found for productId=${productId}, skuId=${skuId}. ` +
        `Call getAliExpressProduct for this product first — skipping freight persistence.`
    )
    return
  }

  const chosen = data.options[0]
  const ttlMs = FREIGHT_TTL_SECONDS * 1000

  await prisma.freightSnapshot.create({
    data: {
      aliExpressSkuId: aliExpressSku.id,
      destination: data.destination,
      freightCost: chosen.freightCost,
      estimatedTaxes: 0, // see KNOWN GAPS comment above — not derivable from this API response
      currency: chosen.currency,
      etaMinDays: chosen.minDays,
      etaMaxDays: chosen.maxDays,
      expiresAt: new Date(Date.now() + ttlMs),
    },
  })
}
