import { prisma } from '../prisma'
import { buildProductDescription, type ProductDescriptionFeature } from './buildProductDescription'

export interface ImportProductVariant {
  skuId: string
  color: string | null
  size: string | null
  options: Record<string, string>
  imageUrl: string | null
  availableStock: number
  sellPrice: number
  currency: string
}

export interface ImportProductGroupPageData {
  productId: string
  title: string
  description: string
  coreFeatures: ProductDescriptionFeature[]
  imageUrls: string[]
  categoryId: string | null
  categoryKey: string | null
  categoryName: string | null
  categoryPath: string[]
  variants: ImportProductVariant[]
  freeShipping: boolean
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
      category: { include: { parent: true } },
      aliExpressCategory: true,
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
  const categoryRows = first.categoryId
    ? await prisma.category.findMany({ select: { id: true, name: true, parentId: true } })
    : []
  const categoryById = new Map(categoryRows.map((category) => [category.id, category]))
  const categoryPath: string[] = []
  const seenCategoryIds = new Set<string>()
  let currentCategory = first.categoryId ? categoryById.get(first.categoryId) : undefined
  while (currentCategory && !seenCategoryIds.has(currentCategory.id)) {
    seenCategoryIds.add(currentCategory.id)
    categoryPath.unshift(currentCategory.name)
    currentCategory = currentCategory.parentId ? categoryById.get(currentCategory.parentId) : undefined
  }

  const displayCategoryName = first.category?.name ?? first.aliExpressCategory?.name ?? null

  const description = buildProductDescription({
    title: first.title,
    description: first.description,
    source: 'import',
    categoryName: displayCategoryName,
    additionalColors: priced.map((sku) => sku.color).filter((value): value is string => Boolean(value)),
    additionalSizes: priced.map((sku) => sku.size).filter((value): value is string => Boolean(value)),
    additionalSpecs: priced.map((sku) => (sku.specs as Record<string, unknown> | null) ?? null),
    variantCount: priced.length,
  })

  return {
    productId,
    title: first.title,
    description: description.overview,
    coreFeatures: description.coreFeatures,
    imageUrls: priced.flatMap((sku) => sku.imageUrls).filter(Boolean).slice(0, 12),
    categoryId: first.categoryId,
    categoryKey: first.categoryId,
    categoryName: displayCategoryName,
    categoryPath,
    freeShipping: priced.some((sku) => sku.importListingPrice?.freeShipping === true),
    variants: priced.map((sku) => ({
      skuId: sku.skuId,
      color: sku.color,
      size: sku.size,
      options: (sku.specs as Record<string, string> | null) ?? {},
      imageUrl: sku.imageUrls[0] ?? null,
      availableStock: sku.availableStock,
      sellPrice: Number(sku.importListingPrice!.sellPrice),
      currency: sku.importListingPrice!.currency,
    })),
    aliExpressUrl: 'https://www.aliexpress.com/item/' + productId + '.html',
  }
}