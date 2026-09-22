import { prisma } from '../prisma'
import { toProductTeaser, type ProductTeaser } from './productTeaser'

/**
 * Featured = featuredOverride is explicitly true, OR (no override AND has
 * a confirmed match with a genuine IMPORT_ADVANTAGE deal). A product with
 * featuredOverride explicitly set to false is excluded even if it would
 * otherwise qualify — that's handled implicitly here since neither OR
 * branch matches `false`.
 */
export async function getFeaturedProducts(limit = 8): Promise<ProductTeaser[]> {
  const products = await prisma.localSKU.findMany({
    where: {
      OR: [
        { featuredOverride: true },
        {
          featuredOverride: null,
          matches: {
            some: {
              status: { in: ['AUTO_MATCHED', 'MANUAL_CONFIRMED'] },
              comparison: { renderMode: 'IMPORT_ADVANTAGE' },
            },
          },
        },
      ],
    },
    include: {
      matches: {
        where: { status: { in: ['AUTO_MATCHED', 'MANUAL_CONFIRMED'] } },
        include: { comparison: true },
      },
    },
    take: limit,
  })

  return products.map((product) => toProductTeaser(product, product.matches))
}
