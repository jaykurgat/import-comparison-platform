import { prisma } from '../prisma'
import { withCache, type CacheResult } from '../cache/withCache'
import { callAliExpressSync, getAliExpressCredentials } from './client'
import { mapProductResult, type MappedAliExpressProduct } from './mappers'
import type { AliExpressProductGetResponse } from './types'

const PRODUCT_TTL_SECONDS = 18 * 60 * 60 // 18h — within the 12-24h spec

/**
 * Fetches an AliExpress product (all its SKUs/variants), with full caching,
 * retry/backoff, circuit breaking, and stale-fallback protection.
 *
 * ship_to_country is required by the API in practice (confirmed by testing
 * — the docs listed it as optional, testing proved otherwise).
 */
export async function getAliExpressProduct(
  productId: string,
  shipToCountry = 'KE'
): Promise<CacheResult<MappedAliExpressProduct>> {
  return withCache<MappedAliExpressProduct>({
    cacheKey: `aliexpress:product:${productId}:${shipToCountry}`,
    ttlSeconds: PRODUCT_TTL_SECONDS,
    serviceName: 'aliexpress',

    fetchFresh: async () => {
      const credentials = getAliExpressCredentials()
      const response = await callAliExpressSync<AliExpressProductGetResponse>(
        'aliexpress.ds.product.get',
        { product_id: productId, ship_to_country: shipToCountry },
        credentials
      )

      const result = response.aliexpress_ds_product_get_response?.result
      if (!result) {
        throw new Error(`Unexpected response shape for product ${productId} — no result field present.`)
      }

      return mapProductResult(result)
    },

    fetchFallback: async () => fetchProductFallback(productId),

    persistFresh: async (data) => persistProduct(data),
  })
}

/**
 * Reconstructs the last known product state from Neon when AliExpress is
 * unreachable and no cache exists. Returns null if this product has never
 * been successfully fetched before — there's genuinely nothing to fall
 * back to in that case.
 */
async function fetchProductFallback(
  productId: string
): Promise<{ data: MappedAliExpressProduct; asOf: Date } | null> {
  const skus = await prisma.aliExpressSKU.findMany({
    where: { productId },
    include: {
      priceHistory: { orderBy: { recordedAt: 'desc' }, take: 1 },
    },
  })

  if (skus.length === 0) return null

  let asOf = new Date(0)
  for (const sku of skus) {
    const latest = sku.priceHistory?.[0]?.recordedAt
    if (latest && latest > asOf) asOf = latest
  }

  const first = skus[0]

  return {
    data: {
      productId,
      title: first.title,
      description: first.description ?? '',
      imageUrls: first.imageUrls,
      rawCategoryId: '', // not persisted separately yet — see CategoryMapping note in schema
      skus: skus.map((sku) => ({
        skuId: sku.skuId,
        skuPrice: Number(sku.skuPrice),
        offerSalePrice: Number(sku.offerSalePrice),
        itemPrice: Number(sku.priceHistory?.[0]?.itemPrice ?? sku.itemPrice),
        currency: sku.currency,
        priceIncludeTax: sku.priceIncludeTax,
        skuCode: sku.skuCode ?? undefined,
        color: sku.color ?? undefined,
        size: sku.size ?? undefined,
        specs: (sku.specs as Record<string, string>) ?? {},
        stock: 0, // stock isn't tracked historically — a fallback genuinely cannot know current stock
      })),
    },
    asOf,
  }
}

/**
 * Persists a freshly-fetched product into Neon: upserts each SKU (by the
 * productId+skuId unique constraint) and records a price snapshot for
 * history. Runs inside withCache's persistFresh, so a failure here is
 * logged but never blocks returning good data to the caller.
 */
async function persistProduct(data: MappedAliExpressProduct): Promise<void> {
  for (const sku of data.skus) {
    const upserted = await prisma.aliExpressSKU.upsert({
      where: {
        productId_skuId: { productId: data.productId, skuId: sku.skuId },
      },
      create: {
        productId: data.productId,
        skuId: sku.skuId,
        title: data.title,
        description: data.description,
        imageUrls: data.imageUrls,
        color: sku.color,
        size: sku.size,
        specs: sku.specs,
        skuPrice: sku.skuPrice,
        offerSalePrice: sku.offerSalePrice,
        itemPrice: sku.itemPrice,
        currency: sku.currency,
        priceIncludeTax: sku.priceIncludeTax,
        skuCode: sku.skuCode,
      },
      update: {
        title: data.title,
        description: data.description,
        imageUrls: data.imageUrls,
        color: sku.color,
        size: sku.size,
        specs: sku.specs,
        itemPrice: sku.itemPrice,
        currency: sku.currency,
      },
    })

    await prisma.aliExpressPriceSnapshot.create({
      data: {
        aliExpressSkuId: upserted.id,
        itemPrice: sku.itemPrice,
      },
    })
  }
}
