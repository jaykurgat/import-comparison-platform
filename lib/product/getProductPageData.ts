import { prisma } from '../prisma'

/**
 * NOTE on outbound links: this project has no cart/checkout system built
 * (nothing in the schema for orders/payments), so this treats LandedCompare
 * as a comparison/discovery layer that sends users to the actual retailer
 * to complete purchase — same model as Google Shopping or PriceRunner, not
 * a full in-house marketplace. If you actually want in-house checkout,
 * that's a much bigger separate build (cart, payments, order management)
 * — flag it if so, this assumption shouldn't be silently locked in.
 *
 * Also: local products have no captured source URL (LocalListingRaw/
 * LocalSKU don't store one, and the CSV importer never asked for one), so
 * there's no "View on Jumia" link for the local side yet — only the
 * AliExpress side has a real, constructible URL (from its productId).
 */

export interface ProductPageComparison {
  renderMode: 'IMPORT_ADVANTAGE' | 'LOCAL_ONLY'
  sellPrice: number // what the customer actually pays for the import option — landed cost + markup
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
    price: number
    currency: string
    color: string | null
    size: string | null
  }
  comparison: ProductPageComparison | null
}

export async function getProductPageData(sku: string): Promise<ProductPageData | null> {
  const localSku = await prisma.localSKU.findUnique({ where: { sku } })
  if (!localSku) return null

  const local = {
    sku: localSku.sku,
    title: localSku.title,
    description: localSku.description,
    imageUrls: localSku.imageUrls,
    price: Number(localSku.currentPrice),
    currency: localSku.currency,
    color: localSku.color,
    size: localSku.size,
  }

  // Only a confirmed match with an already-computed comparison is shown —
  // consistent with the Landed Cost Engine's own eligibility rule. If no
  // one has confirmed a match (or run the landed cost calc) yet, the page
  // just shows the local product with no comparison section.
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
