import { prisma } from '@/lib/prisma'
import { refreshAliExpressProduct } from '@/lib/aliexpress/product'
import { repriceImportSku } from '@/lib/pricing/repriceImportSku'

const PRODUCT_LIMIT = 100
const CANDIDATE_LIMIT = 500
const CONCURRENCY = 3

export interface SupplierSyncSummary {
  selectedProducts: number
  syncedProducts: number
  failedProducts: number
  repricedSkus: number
  changedSkus: number
  unavailableSkus: number
  errors: string[]
}

async function mapWithConcurrency<T>(
  values: string[],
  worker: (value: string) => Promise<T>,
): Promise<T[]> {
  const results: T[] = new Array(values.length)
  let nextIndex = 0

  async function runWorker(): Promise<void> {
    while (true) {
      const index = nextIndex++
      if (index >= values.length) return
      results[index] = await worker(values[index])
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, values.length) }, () => runWorker()),
  )

  return results
}

/**
 * Refreshes the oldest-synced published AliExpress products first.
 *
 * The daily job intentionally rotates through the catalog instead of always
 * taking the same first N products. If the catalog grows beyond one run's
 * capacity, the remaining products move to the front of the next run.
 */
export async function synchronizeAliExpressSupplierCatalog(): Promise<SupplierSyncSummary> {
  const candidates = await prisma.aliExpressSKU.findMany({
    where: { isPublished: true },
    select: { productId: true },
    orderBy: [
      { lastSupplierSyncAt: { sort: 'asc', nulls: 'first' } },
      { productId: 'asc' },
    ],
    take: CANDIDATE_LIMIT,
  })

  const productIds = [...new Set(candidates.map((sku) => sku.productId))].slice(0, PRODUCT_LIMIT)

  const results = await mapWithConcurrency(productIds, async (productId) => {
    let changedSkus = 0
    let repricedSkus = 0
    let unavailableSkus = 0

    try {
      const before = await prisma.aliExpressSKU.findMany({
        where: { productId },
        select: {
          skuId: true,
          isPublished: true,
          itemPrice: true,
          importListingPrice: { select: { sellPrice: true } },
        },
      })

      await refreshAliExpressProduct(productId, 'KE')

      const after = await prisma.aliExpressSKU.findMany({
        where: { productId },
        select: {
          skuId: true,
          isPublished: true,
          itemPrice: true,
        },
      })

      const beforeBySku = new Map(
        before.map((sku) => [
          sku.skuId,
          {
            itemPrice: Number(sku.itemPrice),
            sellPrice: sku.importListingPrice ? Number(sku.importListingPrice.sellPrice) : null,
            isPublished: sku.isPublished,
          },
        ]),
      )

      for (const sku of after) {
        if (!sku.isPublished) {
          if (beforeBySku.get(sku.skuId)?.isPublished) unavailableSkus++
          continue
        }

        const priced = await repriceImportSku(productId, sku.skuId)
        const beforePrice = beforeBySku.get(sku.skuId)

        if (
          beforePrice?.itemPrice !== Number(sku.itemPrice) ||
          beforePrice?.sellPrice !== priced.sellPrice
        ) {
          changedSkus++
        }

        repricedSkus++
      }

      await prisma.aliExpressSKU.updateMany({
        where: { productId, isPublished: true },
        data: { lastSupplierSyncAt: new Date() },
      })

      return {
        ok: true,
        changedSkus,
        repricedSkus,
        unavailableSkus,
        error: null,
      }
    } catch (error) {
      return {
        ok: false,
        changedSkus,
        repricedSkus,
        unavailableSkus,
        error: `${productId}: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  })

  const errors = results.flatMap((result) => (result.error ? [result.error] : []))

  return {
    selectedProducts: productIds.length,
    syncedProducts: results.filter((result) => result.ok).length,
    failedProducts: results.filter((result) => !result.ok).length,
    repricedSkus: results.reduce((total, result) => total + result.repricedSkus, 0),
    changedSkus: results.reduce((total, result) => total + result.changedSkus, 0),
    unavailableSkus: results.reduce((total, result) => total + result.unavailableSkus, 0),
    errors,
  }
}
