import { prisma } from '../prisma'

export interface ImportProductVariant {
  skuId: string
  color: string | null
  size: string | null
  availableStock: number
  sellPrice: number
  currency: string
}

export interface ImportProductGroupPageData {
  productId: string
  title: string
  description: string | null
  imageUrls: string[]
  categoryName: string | null
  variants: ImportProductVariant[]
  aliExpressUrl: string
}

export async function getImportProductGroupPageData(productId: string): Promise<ImportProductGroupPageData | null> {
  const skus = await prisma.aliExpressSKU.findMany({
    where: {
      productId,
      isPublished: true,
      importListingPrice: { isStale: false },
      matches: { none: { status: { in: ['AUTO_MATCHED', 'MANUAL_CONFIRMED'] } } },
    },
    include: {
      category: true,
      importListingPrice: true,
    },
    orderBy: [
      { color: 'asc' },
      { size: 'asc' },
      { skuId: 'asc' },
    ],
  })

  const priced = skus.filter((sku) => sku.importListingPrice)
  if (priced.length === 0) return null

  const first = priced[0]
  return {
    productId,
    title: first.title,
    description: first.description,
    imageUrls: priced.flatMap((sku) => sku.imageUrls).filter(Boolean).slice(0, 12),
    categoryName: first.category?.name ?? null,
    variants: priced.map((sku) => ({
      skuId: sku.skuId,
      color: sku.color,
      size: sku.size,
      availableStock: sku.availableStock,
      sellPrice: Number(sku.importListingPrice!.sellPrice),
      currency: sku.importListingPrice!.currency,
    })),
    aliExpressUrl: 'https://www.aliexpress.com/item/' + productId + '.html',
  }
}