export const dynamic = 'force-dynamic'

import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const products = await prisma.localSKU.findMany({
    where: { inStock: true },
    select: { sku: true, updatedAt: true },
    take: 5000,
  })

  return [
    { url: baseUrl, changeFrequency: 'daily', priority: 1 },
    { url: baseUrl + '/products', changeFrequency: 'daily', priority: 0.9 },
    ...products.map((product) => ({
      url: baseUrl + '/product/' + encodeURIComponent(product.sku),
      lastModified: product.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ]
}
