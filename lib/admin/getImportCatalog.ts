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
  categoryName: string | null
  price: {
    landed: number
    sell: number
    markup: number
    currency: string
    isStale: boolean
    priceDataAsOf: Date
  } | null
}

export interface ImportCatalogPage {
  rows: ImportCatalogRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getImportCatalog(
  requestedPage = 1,
  requestedPageSize = 30,
): Promise<ImportCatalogPage> {
  const pageSize = [20, 30, 50].includes(requestedPageSize) ? requestedPageSize : 30

  const total = await prisma.aliExpressSKU.count()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, requestedPage), totalPages)
  const skip = (page - 1) * pageSize

  const skus = await prisma.aliExpressSKU.findMany({
    include: {
      importListingPrice: true,
      category: { include: { parent: true } },
      aliExpressCategory: true,
    },
    orderBy: { updatedAt: 'desc' },
    skip,
    take: pageSize,
  })

  const rows = skus.map((sku) => ({
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
    categoryName: sku.category
      ? [sku.category.parent?.name, sku.category.name].filter(Boolean).join(' / ')
      : sku.aliExpressCategory?.name ?? null,
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

  return { rows, total, page, pageSize, totalPages }
}
