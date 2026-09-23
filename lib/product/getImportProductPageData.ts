import { prisma } from '../prisma'
import { buildProductDescription, type ProductDescriptionFeature } from './buildProductDescription'

export interface ImportProductPageData {
  productId: string
  skuId: string
  title: string
  description: string
  coreFeatures: ProductDescriptionFeature[]
  imageUrls: string[]
  color: string | null
  size: string | null
  categoryName: string | null
  shipFromCountry: string | null
  availableStock: number
  sellPrice: number
  currency: string
  isStale: boolean
  priceDataAsOf: Date
  aliExpressUrl: string
}

export async function getImportProductPageData(productId: string, skuId: string): Promise<ImportProductPageData | null> {
  const aliExpressSku = await prisma.aliExpressSKU.findUnique({
    where: { productId_skuId: { productId, skuId } },
    include: { category: true, importListingPrice: true },
  })

  if (!aliExpressSku || !aliExpressSku.isPublished || aliExpressSku.availableStock <= 0 || !aliExpressSku.importListingPrice || aliExpressSku.importListingPrice.isStale) {
    return null
  }

  const description = buildProductDescription({
    title: aliExpressSku.title,
    description: aliExpressSku.description,
    source: 'import',
    categoryName: aliExpressSku.category?.name,
    color: aliExpressSku.color,
    size: aliExpressSku.size,
    specs: (aliExpressSku.specs as Record<string, unknown> | null) ?? null,
  })

  return {
    productId: aliExpressSku.productId,
    skuId: aliExpressSku.skuId,
    title: aliExpressSku.title,
    description: description.overview,
    coreFeatures: description.coreFeatures,
    imageUrls: aliExpressSku.imageUrls,
    color: aliExpressSku.color,
    size: aliExpressSku.size,
    categoryName: aliExpressSku.category?.name ?? null,
    shipFromCountry: aliExpressSku.shipFromCountry,
    availableStock: aliExpressSku.availableStock,
    sellPrice: Number(aliExpressSku.importListingPrice.sellPrice),
    currency: aliExpressSku.importListingPrice.currency,
    isStale: aliExpressSku.importListingPrice.isStale,
    priceDataAsOf: aliExpressSku.importListingPrice.priceDataAsOf,
    aliExpressUrl: `https://www.aliexpress.com/item/${aliExpressSku.productId}.html`,
  }
}
