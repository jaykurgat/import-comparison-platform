import { prisma } from '../prisma'

export interface CatalogHealth {
  local: { total: number; missingImages: number; missingDescriptions: number; missingSourceUrls: number; outOfStock: number }
  imports: { total: number; unpublished: number; outOfStock: number; missingPrice: number; stalePrice: number; expiredFreight: number; missingImages: number; missingSkuCodes: number; unresolvedCategories: number }
  matching: { pendingReview: number; rejected: number; confirmed: number }
}

export async function getCatalogHealth(): Promise<CatalogHealth> {
  const now = new Date()

  const [local, importSkus, pendingReview, rejected, confirmed] = await Promise.all([
    prisma.localSKU.findMany({ select: { imageUrls: true, description: true, sourceUrl: true, inStock: true } }),
    prisma.aliExpressSKU.findMany({
      select: {
        availableStock: true,
        isPublished: true,
        importListingPrice: { select: { isStale: true } },
        freightQuotes: {
          where: { destination: 'KE' },
          orderBy: { recordedAt: 'desc' },
          take: 1,
          select: { expiresAt: true },
        },
      },
    }),
    prisma.sKUMatch.count({ where: { status: 'NEEDS_REVIEW' } }),
    prisma.sKUMatch.count({ where: { status: 'REJECTED' } }),
    prisma.sKUMatch.count({ where: { status: { in: ['AUTO_MATCHED', 'MANUAL_CONFIRMED'] } } }),
  ])

  return {
    local: {
      total: local.length,
      missingImages: local.filter((x) => x.imageUrls.length === 0).length,
      missingDescriptions: local.filter((x) => !x.description?.trim()).length,
      outOfStock: local.filter((x) => !x.inStock).length,
    },
    imports: {
      total: importSkus.length,
      unpublished: importSkus.filter((x) => !x.isPublished).length,
      outOfStock: importSkus.filter((x) => x.availableStock <= 0).length,
      missingPrice: importSkus.filter((x) => !x.importListingPrice).length,
      stalePrice: importSkus.filter((x) => x.importListingPrice?.isStale).length,
      expiredFreight: importSkus.filter((x) => {
        const latest = x.freightQuotes[0]
        return !latest || latest.expiresAt <= now
      }).length,
    },
    matching: { pendingReview, rejected, confirmed },
  }
}
