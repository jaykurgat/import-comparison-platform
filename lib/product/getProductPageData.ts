import { prisma } from '../prisma'
import { isCatalogEligible } from '../storefront/catalogEligibility'

export interface ProductPageComparison {
  renderMode: 'IMPORT_ADVANTAGE' | 'LOCAL_ONLY'
  sellPrice: number
  localTotalPrice: number
  isStale: boolean
  priceDataAsOf: Date
  remote: {
    productId: string
    title: string
    imageUrls: string[]
    color: string | null
    size: string | null
    url: string
  }
}

export interface ProductPageData {
  local: {
    sku: string
    title: string
    description: string | null
    imageUrls: string[]
    sourceUrl: string | null
    price: number
    currency: string
    color: string | null
    size: string | null
    inStock: boolean
  }
  comparison: ProductPageComparison | null
}

export async function getProductPageData(sku: string): Promise<ProductPageData | null> {
  const localSku = await prisma.localSKU.findUnique({ where: { sku } })
  if (!localSku || !isCatalogEligible(localSku)) return null

  const local = {
    sku: localSku.sku,
    title: localSku.title,
    description: localSku.description,
    imageUrls: localSku.imageUrls,
    sourceUrl: localSku.sourceUrl,
    price: Number(localSku.currentPrice),
    currency: localSku.currency,
    color: localSku.color,
    size: localSku.size,
    inStock: localSku.inStock,
  }

  // Comparison is enrichment only. A catalog-eligible local product remains
  // available here even when it has no candidate, a weak/rejected candidate,
  // or no computed landed-cost result.
  const confirmedMatch = await prisma.sKUMatch.findFirst({
    where: {
      localSkuId: localSku.id,
      status: { in: ['AUTO_MATCHED', 'MANUAL_CONFIRMED'] },
    },
    include: { aliExpressSku: true, comparison: true },
  })

  if (!confirmedMatch || !confirmedMatch.comparison) {
    return { local, comparison: null }
  }

  const { comparison, aliExpressSku } = confirmedMatch

  return {
    local,
    comparison: {
      renderMode: comparison.renderMode as 'IMPORT_ADVANTAGE' | 'LOCAL_ONLY',
      sellPrice: Number(comparison.sellPrice),
      localTotalPrice: Number(comparison.localTotalPrice),
      isStale: comparison.isStale,
      priceDataAsOf: comparison.priceDataAsOf,
      remote: {
        productId: aliExpressSku.productId,
        title: aliExpressSku.title,
        imageUrls: aliExpressSku.imageUrls,
        color: aliExpressSku.color,
        size: aliExpressSku.size,
        url: `https://www.aliexpress.com/item/${aliExpressSku.productId}.html`,
      },
    },
  }
}
