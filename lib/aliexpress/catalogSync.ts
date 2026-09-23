import { prisma } from '../prisma'
import { isCatalogEligible } from '../storefront/catalogEligibility'
import { getAliExpressFreight } from './freight'
import { discoverAliExpressProducts } from './discovery'
import { getAliExpressProduct } from './product'
import { repriceImportSku } from '../pricing/repriceImportSku'

export interface CatalogSyncOptions {
  limit?: number
  candidatesPerLocal?: number
  freightSkusPerProduct?: number
  shipToCountry?: string
  currency?: string
}

export interface CatalogSyncResult {
  localProductsConsidered: number
  searchesRun: number
  candidatesDiscovered: number
  productsFetched: number
  skusPersisted: number
  freightQuotesFetched: number
  pricesComputed: number
  errors: Array<{ localSku: string; productId?: string; skuId?: string; message: string }>
}

/**
 * Hydrates the AliExpress side of KijijiCart from real local catalog demand.
 *
 * This intentionally does NOT publish products. Discovery/product.get creates
 * durable AliExpressSKU records with isPublished=false. Matching and human
 * review can then decide whether a supplier SKU is appropriate.
 *
 * After a representative Kenya freight quote is persisted, the same SKU is
 * repriced from durable snapshots so the supplier catalog has a usable KES
 * sell price without rediscovering the product.
 */
export async function syncAliExpressCatalog(
  options: CatalogSyncOptions = {},
): Promise<CatalogSyncResult> {
  const limit = clamp(options.limit ?? 20, 1, 100)
  const candidatesPerLocal = clamp(options.candidatesPerLocal ?? 5, 1, 20)
  const freightSkusPerProduct = clamp(options.freightSkusPerProduct ?? 1, 0, 10)
  const shipToCountry = (options.shipToCountry ?? 'KE').toUpperCase()
  const currency = options.currency ?? 'USD'

  const locals = await prisma.localSKU.findMany({
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })

  const eligibleLocals = locals.filter(isCatalogEligible)
  const result: CatalogSyncResult = {
    localProductsConsidered: eligibleLocals.length,
    searchesRun: 0,
    candidatesDiscovered: 0,
    productsFetched: 0,
    skusPersisted: 0,
    freightQuotesFetched: 0,
    pricesComputed: 0,
    errors: [],
  }

  const seenProducts = new Set<string>()

  for (const local of eligibleLocals) {
    try {
      result.searchesRun++

      const discovery = await discoverAliExpressProducts({
        keyword: local.title,
        shipToCountry,
        currency,
        textPageSize: candidatesPerLocal,
      })

      const candidates = discovery.slice(0, candidatesPerLocal)
      result.candidatesDiscovered += candidates.length

      for (const candidate of candidates) {
        if (seenProducts.has(candidate.productId)) continue
        seenProducts.add(candidate.productId)

        try {
          const product = await getAliExpressProduct(candidate.productId, shipToCountry)
          result.productsFetched++
          result.skusPersisted += product.data.skus.length

          if (freightSkusPerProduct === 0) continue

          const freightTargets = product.data.skus
            .filter((sku) => sku.stock > 0)
            .slice(0, freightSkusPerProduct)

          for (const sku of freightTargets) {
            try {
              const freight = await getAliExpressFreight({
                productId: product.data.productId,
                skuId: sku.skuId,
                shipToCountry,
                quantity: 1,
                currency,
              })

              if (freight.data.options.length > 0) {
                result.freightQuotesFetched++

                if (shipToCountry === 'KE' && currency === 'USD') {
                  try {
                    await repriceImportSku(product.data.productId, sku.skuId)
                    result.pricesComputed++
                  } catch (error) {
                    result.errors.push({
                      localSku: local.sku,
                      productId: candidate.productId,
                      skuId: sku.skuId,
                      message: error instanceof Error ? error.message : String(error),
                    })
                  }
                }
              }
            } catch (error) {
              result.errors.push({
                localSku: local.sku,
                productId: candidate.productId,
                skuId: sku.skuId,
                message: error instanceof Error ? error.message : String(error),
              })
            }
          }
        } catch (error) {
          result.errors.push({
            localSku: local.sku,
            productId: candidate.productId,
            message: error instanceof Error ? error.message : String(error),
          })
        }
      }
    } catch (error) {
      result.errors.push({
        localSku: local.sku,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return result
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.trunc(value), min), max)
}
