import { prisma } from '../prisma'
import { toProductTeaser, type ProductTeaser } from './productTeaser'
import { isCatalogEligible } from './catalogEligibility'

/**
 * Featured status never bypasses catalog eligibility: an incomplete product
 * must not appear on the storefront simply because it was manually featured.
 */
export async function getFeaturedProducts(limit = 8): Promise<ProductTeaser[]> {
  const products = await prisma.localSKU.findMany({
    where: { featuredOverride: true },
    include: {
      matches: {
        where: { status: { in: ['AUTO_MATCHED', 'MANUAL_CONFIRMED'] } },
        include: { comparison: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return products
    .filter(isCatalogEligible)
    .slice(0, limit)
    .map((product) => toProductTeaser(product, product.matches))
}
