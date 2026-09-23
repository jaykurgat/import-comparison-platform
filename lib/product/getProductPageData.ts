import { prisma } from '../prisma'
import { isCatalogEligible } from '../storefront/catalogEligibility'
import { buildProductDescription, type ProductDescriptionFeature } from './buildProductDescription'

export interface ProductPageComparison {
  renderMode: 'IMPORT_ADVANTAGE' | 'LOCAL_ONLY'
  sellPrice: number
  localTotalPrice: number
  isStale: boolean
  priceDataAsOf: Date
  remote: {
    productId: string
    skuId: string
    title: string
    imageUrls: string[]
    color: string | null
    size: string | null
    url: string
    isPublished: boolean
    availableStock: number
  }
}

export interface ProductPageData {
  local: {
    sku: string
    title: string
    description: string
    coreFeatures: ProductDescriptionFeature[]
    imageUrls: string[]
    sourceUrl: string | null
    price: number
    currency: string
    color: string | null
    size: string | null
    inStock: boolean
    categoryId: string | null
    categoryName: string | null
  }
  comparison: ProductPageComparison | null
}

export async function getProductPageData(sku: string): Promise<ProductPageData | null> {
  const localSku = await prisma.localSKU.findUnique({ where: { sku }, include: { category: true } })
  if (!localSku || !isCatalogEligible(localSku)) return null

  const description = buildProductDescription({
    title: localSku.title,
    description: localSku.description,
    source: 'local',
    categoryName: localSku.category?.name,
    color: localSku.color,
    size: localSku.size,
    specs: (localSku.specs as Record<string, unknown> | null) ?? null,
  })

  const local = {
    sku: localSku.sku,
    title: localSku.title,
    description: description.overview,
    coreFeatures: description.coreFeatures,
    imageUrls: localSku.imageUrls,
    sourceUrl: localSku.sourceUrl,
    price: Number(localSku.currentPrice),
    currency: localSku.currency,
    color: localSku.color,
    size: localSku.size,
    inStock: localSku.inStock,
    categoryId: localSku.categoryId,
    categoryName: localSku.category?.name ?? null,
  }

  const confirmedMatch = await prisma.sKUMatch.findFirst({
    where: {
      localSkuId: localSku.id,
      status: { in: ['AUTO_MATCHED', 'MANUAL_CONFIRMED'] },
    },
    include: { aliExpressSku: true, comparison: true },
  })

  if (!confirmedMatch || !confirmedMatch.comparison) return { local, comparison: null }

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
        skuId: aliExpressSku.skuId,
        title: aliExpressSku.title,
        imageUrls: aliExpressSku.imageUrls,
        color: aliExpressSku.color,
        size: aliExpressSku.size,
        url: `https://www.aliexpress.com/item/${aliExpressSku.productId}.html`,
        isPublished: aliExpressSku.isPublished,
        availableStock: aliExpressSku.availableStock,
      },
    },
  }
}
