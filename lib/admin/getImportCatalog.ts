import { prisma } from '../prisma'

export interface ImportCatalogRow {
  id: string
  productId: string
  skuId: string
  title: string
  imageUrl: string | null
  currency: string
  itemPrice: number
  stock: number
  isPublished: boolean
  shipFromCountry: string | null
  price: {
    landed: number
    sell: number
    markup: number
    currency: string
    isStale: boolean
    priceDataAsOf: Date
  } | null
}

export async function getImportCatalog(): Promise<ImportCatalogRow[]> {
  const skus = await prisma.aliExpressSKU.findMany({
    include: { importListingPrice: true },
    orderBy: { updatedAt: 'desc' },
    take: 250,
  })

  return skus.map((sku) => ({
    id: sku.id,
    productId: sku.productId,
    skuId: sku.skuId,
    title: sku.title,
    imageUrl: sku.imageUrls[0] ?? null,
    currency: sku.currency,
    itemPrice: Number(sku.itemPrice),
    stock: sku.availableStock,
    isPublished: sku.isPublished,
    shipFromCountry: sku.shipFromCountry,
    price: sku.importListingPrice
      ? {
          landed: Number(sku.importListingPrice.landedImportPrice),
          sell: Number(sku.importListingPrice.sellPrice),
          markup: Number(sku.importListingPrice.markup),
          currency: sku.importListingPrice.currency,
          isStale: sku.importListingPrice.isStale,
          priceDataAsOf: sku.importListingPrice.priceDataAsOf,
        }
      : null,
  }))
}
