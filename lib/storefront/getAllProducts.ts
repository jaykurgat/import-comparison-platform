import { prisma } from '../prisma'
import { toProductTeaser, toImportProductTeaser, type ProductTeaser } from './productTeaser'

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
  const localTeasers = localProducts.map((product) => toProductTeaser(product, product.matches))

  // Standalone import products: published, AND with no confirmed match at
  // all. If a published AliExpress SKU DOES have a confirmed match, it's
  // already represented via that local product's card above — showing it
  // again here would be a confusing duplicate.
  const standaloneImportSkus = await prisma.aliExpressSKU.findMany({
    where: {
      ...(textFilter ? { title: textFilter } : {}),
      isPublished: true,
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
