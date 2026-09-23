import { prisma } from '../prisma'

export interface StorefrontCategory {
  id: string
  name: string
  productCount: number
}

export async function getStorefrontCategories(limit = 12): Promise<StorefrontCategory[]> {
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { localSkus: { some: { inStock: true } } },
        { aliExpressSkus: { some: { isPublished: true, availableStock: { gt: 0 } } } },
      ],
    },
    include: {
      _count: {
        select: {
          localSkus: { where: { inStock: true } },
          aliExpressSkus: { where: { isPublished: true, availableStock: { gt: 0 } } },
        },
      },
    },
    orderBy: { name: 'asc' },
    take: limit,
  })

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    productCount: category._count.localSkus + category._count.aliExpressSkus,
  }))
}
