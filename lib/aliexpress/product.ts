import { prisma } from '../prisma'
import { buildProductDescription } from '../product/buildProductDescription'
import { resolveAliExpressCategory } from './categories'
import { resolveCanonicalCategory } from '../categories/resolveCanonicalCategory'
import { withCache, type CacheResult } from '../cache/withCache'
import { callAliExpressSync, getAliExpressCredentials } from './client'
import { mapProductResult, type MappedAliExpressProduct } from './mappers'
import type { AliExpressProductGetResponse } from './types'

const PRODUCT_TTL_SECONDS = 18 * 60 * 60

export async function getAliExpressProduct(
  productId: string,
  shipToCountry = 'KE',
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
        credentials,
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

async function fetchProductFallback(
  productId: string,
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
      rawCategoryId: first.rawCategoryId ?? '',
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
        variantImageUrl: sku.imageUrls[0] ?? undefined,
        stock: sku.availableStock,
      })),
    },
    asOf,
  }
}

async function persistProduct(data: MappedAliExpressProduct): Promise<void> {
  const existingSkus = await prisma.aliExpressSKU.findMany({
    where: { productId: data.productId },
    select: { skuId: true, description: true },
  })
  const existingDescriptions = new Map(existingSkus.map((sku) => [sku.skuId, sku.description]))

  if (data.skus.length > 0) {
    await prisma.aliExpressSKU.updateMany({
      where: {
        productId: data.productId,
        skuId: { notIn: data.skus.map((sku) => sku.skuId) },
      },
      data: { isPublished: false },
    })
  }

  const exactCategory = await resolveAliExpressCategory(data.rawCategoryId)

  for (const sku of data.skus) {
    const resolvedCategory = await resolveCanonicalCategory({
      source: 'ALIEXPRESS',
      sourceCategoryId: data.rawCategoryId,
      title: data.title,
      specs: sku.specs,
    })

    const description = buildProductDescription({
      title: data.title,
      description: data.description || existingDescriptions.get(sku.skuId),
      source: 'import',
      color: sku.color,
      size: sku.size,
      specs: sku.specs,
    }).overview

    const imageUrls = sku.variantImageUrl
      ? [sku.variantImageUrl, ...data.imageUrls.filter((url) => url !== sku.variantImageUrl)]
      : data.imageUrls

    const upserted = await prisma.aliExpressSKU.upsert({
      where: {
        productId_skuId: { productId: data.productId, skuId: sku.skuId },
      },
      create: {
        productId: data.productId,
        skuId: sku.skuId,
        title: data.title,
        description,
        imageUrls,
        rawCategoryId: data.rawCategoryId,
        categoryId: resolvedCategory?.categoryId ?? undefined,
        aliExpressCategoryId: exactCategory?.leafDbId ?? undefined,
        color: sku.color,
        size: sku.size,
        specs: sku.specs,
        skuPrice: sku.skuPrice,
        offerSalePrice: sku.offerSalePrice,
        itemPrice: sku.itemPrice,
        currency: sku.currency,
        priceIncludeTax: sku.priceIncludeTax,
        skuCode: sku.skuCode,
        availableStock: sku.stock,
      },
      update: {
        title: data.title,
        description,
        imageUrls,
        rawCategoryId: data.rawCategoryId,
        ...(resolvedCategory ? { categoryId: resolvedCategory.categoryId } : {}),
        aliExpressCategoryId: exactCategory?.leafDbId ?? undefined,
        color: sku.color,
        size: sku.size,
        specs: sku.specs,
        skuPrice: sku.skuPrice,
        offerSalePrice: sku.offerSalePrice,
        itemPrice: sku.itemPrice,
        currency: sku.currency,
        priceIncludeTax: sku.priceIncludeTax,
        skuCode: sku.skuCode,
        availableStock: sku.stock,
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
