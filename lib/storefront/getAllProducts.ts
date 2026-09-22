import { prisma } from '../prisma'
import { toProductTeaser, toImportProductTeaser, type ProductTeaser } from './productTeaser'
import { isCatalogEligible } from './catalogEligibility'

export async function getAllProducts(query = ''): Promise<ProductTeaser[]> {
  const q = query.trim()
  const textFilter = q ? { contains: q, mode: 'insensitive' as const } : undefined
  const localProducts = await prisma.localSKU.findMany({
    where: textFilter ? { title: textFilter } : undefined,
    include: {
      matches: {
        where: { status: { in: ['AUTO_MATCHED', 'MANUAL_CONFIRMED'] } },
        include: { comparison: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Matching is enrichment, not catalog eligibility. A local product remains
  // listable without an AliExpress match, while incomplete records stay hidden.
  const localTeasers = localProducts
    .filter(isCatalogEligible)
    .map((product) => toProductTeaser(product, product.matches))

  // An import listing is sellable only while at least one persisted SKU has
  // stock. Hydrated supplier data can remain unpublished/out of stock without
  // leaking into the customer catalog.
  const standaloneImportSkus = await prisma.aliExpressSKU.findMany({
    where: {
      ...(textFilter ? { title: textFilter } : {}),
      isPublished: true,
      availableStock: { gt: 0 },
      matches: { none: { status: { in: ['AUTO_MATCHED', 'MANUAL_CONFIRMED'] } } },
    },
    include: { importListingPrice: true },
    orderBy: { createdAt: 'desc' },
  })
  const importTeasers = standaloneImportSkus
    .map((sku) => toImportProductTeaser(sku))
    .filter((t): t is ProductTeaser => t !== null)

  return [...localTeasers, ...importTeasers]
}
