import { prisma } from '../prisma'
import { toProductTeaser, toImportProductTeaser, type ProductTeaser, type StandaloneImportSkuLike } from './productTeaser'
import { isCatalogEligible } from './catalogEligibility'
import { getStorefrontCategoryFilterScope } from './getCategories'

export type CatalogSourceFilter = 'all' | 'local' | 'import' | 'deals'
export type CatalogSort = 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name'

/**
 * Returns one unified customer-facing catalogue.
 *
 * Local products and standalone supplier products share the same grid. A
 * confirmed supplier match is enrichment for the local product, not a second
 * catalogue entry. The source argument is retained for backwards compatibility
 * with older callers, but source-specific storefront filters are intentionally
 * ignored.
 */
export async function getAllProducts(
  query = '',
  categoryKey = '',
  _source: CatalogSourceFilter = 'all',
  sort: CatalogSort = 'featured',
  limit?: number,
): Promise<ProductTeaser[]> {
  void _source
  const q = query.trim()
  const textFilter = q ? { contains: q, mode: 'insensitive' as const } : undefined
  const categoryScope = categoryKey ? await getStorefrontCategoryFilterScope(categoryKey) : null
  const categoryIds = categoryScope?.categoryIds ?? []
  const invalidCategoryFilter = Boolean(categoryKey) && !categoryScope

  const localProducts = invalidCategoryFilter
    ? []
    : await prisma.localSKU.findMany({
        where: {
          ...(textFilter ? { title: textFilter } : {}),
          ...(categoryScope ? { categoryId: { in: categoryIds } } : {}),
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

  const standaloneImportSkus = invalidCategoryFilter
    ? []
    : await prisma.aliExpressSKU.findMany({
        where: {
          ...(textFilter ? { title: textFilter } : {}),
          ...(categoryScope ? { categoryId: { in: categoryIds } } : {}),
          isPublished: true,
          importListingPrice: { isStale: false },
          matches: { none: { status: { in: ['AUTO_MATCHED', 'MANUAL_CONFIRMED'] } } },
        },
        include: {\n          category: true,\n          aliExpressCategory: true,\n          importListingPrice: true,\n          freightQuotes: {\n            where: { destination: 'KE', expiresAt: { gt: new Date() } },\n            orderBy: { recordedAt: 'desc' },\n            take: 1,\n          },\n        },
      })

  const groupedImports = new Map<string, StandaloneImportSkuLike[]>()
  for (const sku of standaloneImportSkus) {
    const group = groupedImports.get(sku.productId) ?? []
    group.push(sku)
    groupedImports.set(sku.productId, group)
  }

  const importTeasers = [...groupedImports.values()]
    .map((group) => toImportProductTeaser(group))
    .filter((product): product is ProductTeaser => product !== null)

  const products = [...localTeasers, ...importTeasers]

  products.sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price || a.title.localeCompare(b.title)
    if (sort === 'price_desc') return b.price - a.price || a.title.localeCompare(b.title)
    if (sort === 'name') return a.title.localeCompare(b.title)
    if (sort === 'newest') return b.createdAt.getTime() - a.createdAt.getTime()
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  return typeof limit === 'number' ? products.slice(0, Math.max(1, limit)) : products
}
