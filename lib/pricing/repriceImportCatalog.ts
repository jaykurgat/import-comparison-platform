import { prisma } from '../prisma'
import { repriceImportSku } from './repriceImportSku'

export interface RepriceImportCatalogOptions {
  limit?: number
  publishedOnly?: boolean
}

export interface RepriceImportCatalogResult {
  skusConsidered: number
  pricesComputed: number
  errors: Array<{ productId: string; skuId: string; message: string }>
}

/**
 * Reprices the durable AliExpress supplier catalog without rediscovering
 * products. This keeps catalog repricing separate from expensive discovery
 * and product hydration.
 */
export async function repriceImportCatalog(
  options: RepriceImportCatalogOptions = {},
): Promise<RepriceImportCatalogResult> {
  const limit = clamp(options.limit ?? 100, 1, 500)
  const publishedOnly = options.publishedOnly ?? false

  const skus = await prisma.aliExpressSKU.findMany({
    where: {
      ...(publishedOnly ? { isPublished: true } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })

  const result: RepriceImportCatalogResult = {
    skusConsidered: skus.length,
    pricesComputed: 0,
    errors: [],
  }

  for (const sku of skus) {
    try {
      await repriceImportSku(sku.productId, sku.skuId)
      result.pricesComputed++
    } catch (error) {
      result.errors.push({
        productId: sku.productId,
        skuId: sku.skuId,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return result
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.trunc(value), min), max)
}
