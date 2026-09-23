import { prisma } from '../prisma'

export interface ImportProductPageData {
  productId: string
  skuId: string
  title: string
  description: string | null // raw HTML, as AliExpress provides it
  imageUrls: string[]
  color: string | null
  size: string | null
  sellPrice: number
  currency: string
  isStale: boolean
  priceDataAsOf: Date
}

export async function getImportProductPageData(
  productId: string,
  skuId: string
): Promise<ImportProductPageData | null> {
  const aliExpressSku = await prisma.aliExpressSKU.findUnique({
    where: { productId_skuId: { productId, skuId } },
    include: { importListingPrice: true },
  })

  // Not found, not published, out of stock, or not yet priced — all treated
  // the same: there is no valid sellable import listing to show.
  if (
    !aliExpressSku ||
    !aliExpressSku.isPublished ||
    aliExpressSku.availableStock <= 0 ||
    !aliExpressSku.importListingPrice ||
    aliExpressSku.importListingPrice.isStale
  ) {
    return null
  }

  return {
    productId: aliExpressSku.productId,
    skuId: aliExpressSku.skuId,
    title: aliExpressSku.title,
    description: aliExpressSku.description,
    imageUrls: aliExpressSku.imageUrls,
    color: aliExpressSku.color,
    size: aliExpressSku.size,
    sellPrice: Number(aliExpressSku.importListingPrice.sellPrice),
    currency: aliExpressSku.importListingPrice.currency,
    isStale: aliExpressSku.importListingPrice.isStale,
    priceDataAsOf: aliExpressSku.importListingPrice.priceDataAsOf,
  }
}
