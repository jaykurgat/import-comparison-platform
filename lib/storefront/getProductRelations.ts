import { prisma } from '../prisma'
import { isCatalogEligible } from './catalogEligibility'
import { titleSimilarity } from '../matching/similarity'
import type { ProductTeaser } from './productTeaser'

const CONFIRMED_MATCH_STATUSES = ['AUTO_MATCHED', 'MANUAL_CONFIRMED']

interface RelatedCandidate {
  product: ProductTeaser
  score: number
}

function attributeSimilarity(
  left: { color: string | null; size: string | null; specs: unknown },
  right: { color: string | null; size: string | null; specs: unknown },
): number {
  const leftPairs = new Set<string>()
  const rightPairs = new Set<string>()

  if (left.color) leftPairs.add('color=' + left.color.trim().toLowerCase())
  if (left.size) leftPairs.add('size=' + left.size.trim().toLowerCase())
  if (right.color) rightPairs.add('color=' + right.color.trim().toLowerCase())
  if (right.size) rightPairs.add('size=' + right.size.trim().toLowerCase())

  const leftSpecs = (left.specs as Record<string, unknown> | null) ?? {}
  const rightSpecs = (right.specs as Record<string, unknown> | null) ?? {}

  for (const [key, value] of Object.entries(leftSpecs)) {
    leftPairs.add(key.trim().toLowerCase() + '=' + String(value).trim().toLowerCase())
  }
  for (const [key, value] of Object.entries(rightSpecs)) {
    rightPairs.add(key.trim().toLowerCase() + '=' + String(value).trim().toLowerCase())
  }

  if (leftPairs.size === 0 || rightPairs.size === 0) return 0

  let overlap = 0
  for (const pair of leftPairs) {
    if (rightPairs.has(pair)) overlap++
  }

  return overlap / Math.max(leftPairs.size, rightPairs.size)
}

function relatedScore(
  titleA: string,
  attrsA: { color: string | null; size: string | null; specs: unknown },
  titleB: string,
  attrsB: { color: string | null; size: string | null; specs: unknown },
): number {
  return titleSimilarity(titleA, titleB) * 0.75 + attributeSimilarity(attrsA, attrsB) * 0.25
}

export async function getRelatedProductsForLocal(
  localSku: string,
  categoryId: string | null,
  title: string,
  limit = 6,
): Promise<ProductTeaser[]> {
  if (!categoryId) return []

  const [locals, imports] = await Promise.all([
    prisma.localSKU.findMany({
      where: {
        categoryId,
        sku: { not: localSku },
      },
      include: { category: true },
    }),
    prisma.aliExpressSKU.findMany({
      where: {
        categoryId,
        isPublished: true,
        importListingPrice: { isStale: false },
      },
      include: { category: true, importListingPrice: true },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
  ])

  const candidates: RelatedCandidate[] = locals
    .filter(isCatalogEligible)
    .map((product) => ({
      score: relatedScore(
        title,
        { color: null, size: null, specs: null },
        product.title,
        { color: null, size: null, specs: null },
      ),
      product: {
        sku: product.sku,
        href: '/product/' + encodeURIComponent(product.sku),
        title: product.title,
        imageUrl: product.imageUrls[0] ?? null,
        price: Number(product.currentPrice),
        currency: product.currency,
        hasDeal: false,
        savingsAmount: null,
        source: 'local',
        categoryName: product.category?.name ?? null,
        inStock: product.inStock,
        variantCount: 1,
        availableVariantCount: product.inStock ? 1 : 0,
        createdAt: product.createdAt,
      },
    }))

  for (const sku of imports) {
    const price = sku.importListingPrice
    if (!price || Number(price.sellPrice) <= 0) continue

    candidates.push({
      score: relatedScore(
        title,
        { color: null, size: null, specs: null },
        sku.title,
        { color: sku.color, size: sku.size, specs: sku.specs },
      ),
      product: {
        sku: 'import-' + sku.productId,
        href: '/import/' + encodeURIComponent(sku.productId),
        title: sku.title,
        imageUrl: sku.imageUrls[0] ?? null,
        price: Number(price.sellPrice),
        currency: price.currency,
        hasDeal: false,
        savingsAmount: null,
        source: 'import',
        categoryName: sku.category?.name ?? null,
        inStock: sku.availableStock > 0,
        variantCount: 1,
        availableVariantCount: sku.availableStock > 0 ? 1 : 0,
        createdAt: sku.createdAt,
      },
    })
  }

  return dedupeAndRank(candidates, limit)
}

export async function getRelatedProductsForImport(
  productId: string,
  categoryId: string | null,
  title: string,
  limit = 6,
): Promise<ProductTeaser[]> {
  if (!categoryId) return []

  const imports = await prisma.aliExpressSKU.findMany({
    where: {
      productId: { not: productId },
      categoryId,
      isPublished: true,
      importListingPrice: { isStale: false },
    },
    include: { category: true, importListingPrice: true },
    orderBy: { createdAt: 'desc' },
    take: 80,
  })

  const candidates = imports
    .filter((sku) => sku.importListingPrice && Number(sku.importListingPrice.sellPrice) > 0)
    .map((sku) => ({
      score: relatedScore(
        title,
        { color: null, size: null, specs: null },
        sku.title,
        { color: sku.color, size: sku.size, specs: sku.specs },
      ),
      product: {
        sku: 'import-' + sku.productId,
        href: '/import/' + encodeURIComponent(sku.productId),
        title: sku.title,
        imageUrl: sku.imageUrls[0] ?? null,
        price: Number(sku.importListingPrice!.sellPrice),
        currency: sku.importListingPrice!.currency,
        hasDeal: false,
        savingsAmount: null,
        source: 'import' as const,
        categoryName: sku.category?.name ?? null,
        inStock: sku.availableStock > 0,
        variantCount: 1,
        availableVariantCount: sku.availableStock > 0 ? 1 : 0,
        createdAt: sku.createdAt,
      },
    }))

  return dedupeAndRank(candidates, limit)
}

export async function getComparableImportsForLocal(
  localSkuId: string,
  limit = 4,
): Promise<ProductTeaser[]> {
  const matches = await prisma.sKUMatch.findMany({
    where: {
      localSkuId,
      status: { in: CONFIRMED_MATCH_STATUSES },
      aliExpressSku: {
        isPublished: true,
        importListingPrice: { isStale: false },
      },
    },
    include: {
      aliExpressSku: {
        include: { category: true, importListingPrice: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit * 2,
  })

  return matches
    .filter((match) => match.aliExpressSku.importListingPrice)
    .map((match) => {
      const sku = match.aliExpressSku
      return {
        sku: 'import-' + sku.productId + '-' + sku.skuId,
        href: '/import/' + encodeURIComponent(sku.productId),
        title: sku.title,
        imageUrl: sku.imageUrls[0] ?? null,
        price: Number(sku.importListingPrice!.sellPrice),
        currency: sku.importListingPrice!.currency,
        hasDeal: false,
        savingsAmount: null,
        source: 'import' as const,
        categoryName: sku.category?.name ?? null,
        inStock: sku.availableStock > 0,
        variantCount: 1,
        availableVariantCount: sku.availableStock > 0 ? 1 : 0,
        createdAt: sku.createdAt,
      }
    })
}

export async function getComparableLocalsForImport(
  productId: string,
  skuId: string,
  limit = 4,
): Promise<ProductTeaser[]> {
  const matchRows = await prisma.sKUMatch.findMany({
    where: {
      aliExpressSku: {
        productId,
        skuId,
      },
      status: { in: CONFIRMED_MATCH_STATUSES },
    },
    include: { localSku: { include: { category: true } } },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })

  return matchRows
    .filter((match) => isCatalogEligible(match.localSku))
    .map((match) => {
      const local = match.localSku
      return {
        sku: local.sku,
        href: '/product/' + encodeURIComponent(local.sku),
        title: local.title,
        imageUrl: local.imageUrls[0] ?? null,
        price: Number(local.currentPrice),
        currency: local.currency,
        hasDeal: true,
        savingsAmount: null,
        source: 'local' as const,
        categoryName: local.category?.name ?? null,
        inStock: local.inStock,
        variantCount: 1,
        availableVariantCount: local.inStock ? 1 : 0,
        createdAt: local.createdAt,
      }
    })
}

function dedupeAndRank(candidates: RelatedCandidate[], limit: number): ProductTeaser[] {
  const byKey = new Map<string, RelatedCandidate>()

  for (const candidate of candidates) {
    const key = candidate.product.source + ':' + candidate.product.href
    const existing = byKey.get(key)
    if (!existing || candidate.score > existing.score) {
      byKey.set(key, candidate)
    }
  }

  return [...byKey.values()]
    .sort((a, b) => b.score - a.score || b.product.createdAt.getTime() - a.product.createdAt.getTime())
    .slice(0, limit)
    .map((candidate) => candidate.product)
}
