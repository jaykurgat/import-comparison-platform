import { prisma } from '../prisma'

/**
 * Simplified, UI-ready shape for one pending match — flattens the two
 * related records (LocalSKU, AliExpressSKU) into what the review page
 * actually needs to render, so the page component doesn't touch Prisma
 * field names directly.
 */
export interface ReviewQueueItem {
  matchId: string
  matchSignal: string | null
  confidenceNote: string | null
  local: {
    sku: string
    title: string
    imageUrl: string | null
    price: number
    currency: string
    color: string | null
    size: string | null
  }
  remote: {
    productId: string
    skuId: string
    title: string
    imageUrl: string | null
    price: number
    currency: string
    color: string | null
    size: string | null
  }
}

export async function getReviewQueue(): Promise<ReviewQueueItem[]> {
  const matches = await prisma.sKUMatch.findMany({
    where: { status: 'NEEDS_REVIEW' },
    include: { localSku: true, aliExpressSku: true },
    orderBy: { createdAt: 'asc' },
  })

  return matches.map((match) => ({
    matchId: match.id,
    matchSignal: match.matchSignal,
    confidenceNote: match.confidenceNote,
    local: {
      sku: match.localSku.sku,
      title: match.localSku.title,
      imageUrl: match.localSku.imageUrls[0] ?? null,
      price: Number(match.localSku.currentPrice),
      currency: match.localSku.currency,
      color: match.localSku.color,
      size: match.localSku.size,
    },
    remote: {
      productId: match.aliExpressSku.productId,
      skuId: match.aliExpressSku.skuId,
      title: match.aliExpressSku.title,
      imageUrl: match.aliExpressSku.imageUrls[0] ?? null,
      price: Number(match.aliExpressSku.itemPrice),
      currency: match.aliExpressSku.currency,
      color: match.aliExpressSku.color,
      size: match.aliExpressSku.size,
    },
  }))
}
