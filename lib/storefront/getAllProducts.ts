import { prisma } from '../prisma'
import { toProductTeaser, toImportProductTeaser, type ProductTeaser, type StandaloneImportSkuLike } from './productTeaser'
import { isCatalogEligible } from './catalogEligibility'

export type CatalogSourceFilter = 'all' | 'local' | 'import' | 'deals'
export type CatalogSort = 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name'

export async function getAllProducts(
  query = '',
  categoryId = '',
  source: CatalogSourceFilter = 'all',
  sort: CatalogSort = 'featured',
): Promise<ProductTeaser[]> {
  const q = query.trim()
  const textFilter = q ? { contains: q, mode: 'insensitive' as const } : undefined

  const localProducts = source === 'import'
    ? []
    : await prisma.localSKU.findMany({
        where: {
          ...(textFilter ? { title: textFilter } : {}),
          ...(categoryId ? { categoryId } : {}),
        },
        include: {
          category: true,
          matches: {
            where: { status: { in: ['AUTO_MATCHED', 'MANUAL_CONFIRMED'] } },
            include: { comparison: true },
          },
        },
      })

  const localTeasers = localProducts
    .filter(isCatalogEligible)
    .map((product) => toProductTeaser(product, product.matches))
    .filter((product) => source !== 'deals' || product.hasDeal)

  const standaloneImportSkus = source === 'local' || source === 'deals'
    ? []
    : await prisma.aliExpressSKU.findMany({
        where: {
          ...(textFilter ? { title: textFilter } : {}),
          isPublished: true,
          importListingPrice: { isStale: false },
          matches: { none: { status: { in: ['AUTO_MATCHED', 'MANUAL_CONFIRMED'] } } },
        },
        include: { category: true, aliExpressCategory: true, importListingPrice: true },
      })

  const groupedImports = new Map<string, StandaloneImportSkuLike[]>()
  for (const sku of standaloneImportSkus) {
    const group = groupedImports.get(sku.productId) ?? []
    group.push(sku)
    groupedImports.set(sku.productId, group)
  }

  const importTeasers = [...groupedImports.values()]
    .map((group) => toImportProductTeaser(group))
    .filter((t): t is ProductTeaser => t !== null)

  const products = [...localTeasers, ...importTeasers]

  products.sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price || a.title.localeCompare(b.title)
    if (sort === 'price_desc') return b.price - a.price || a.title.localeCompare(b.title)
    if (sort === 'name') return a.title.localeCompare(b.title)
    if (sort === 'newest') return b.createdAt.getTime() - a.createdAt.getTime()
    return Number(b.hasDeal) - Number(a.hasDeal) || b.createdAt.getTime() - a.createdAt.getTime()
  })

  return products
}
