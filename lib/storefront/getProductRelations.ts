import { prisma } from '../prisma'
import { isCatalogEligible } from './catalogEligibility'
import { titleSimilarity } from '../matching/similarity'
import { getStorefrontCategoryFilterScope } from './getCategories'
import type { ProductTeaser } from './productTeaser'

const CONFIRMED_MATCH_STATUSES: Array<'AUTO_MATCHED' | 'MANUAL_CONFIRMED'> = ['AUTO_MATCHED', 'MANUAL_CONFIRMED']


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

function toLocalTeaser(product: {
  sku: string
  title: string
  imageUrls: string[]
  currentPrice: { toString(): string }
  currency: string
  category?: { name: string } | null
  inStock: boolean
  createdAt: Date
}): ProductTeaser {
  return {
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
  }
}

function toImportTeaser(sku: {
  productId: string
  skuId: string
  title: string
  imageUrls: string[]
  availableStock: number
  createdAt: Date
  category?: { name: string } | null
  aliExpressCategory?: { name: string } | null
  importListingPrice: { sellPrice: { toString(): string }; currency: string } | null
}): ProductTeaser | null {
  if (!sku.importListingPrice || Number(sku.importListingPrice.sellPrice) <= 0) return null

  return {
    sku: 'import-' + sku.productId + '-' + sku.skuId,
    href: '/import/' + encodeURIComponent(sku.productId),
    title: sku.title,
    imageUrl: sku.imageUrls[0] ?? null,
    price: Number(sku.importListingPrice.sellPrice),
    currency: sku.importListingPrice.currency,
    hasDeal: false,
    savingsAmount: null,
    source: 'import',
    categoryName: sku.aliExpressCategory?.name ?? sku.category?.name ?? null,
    inStock: sku.availableStock > 0,
    variantCount: 1,
    availableVariantCount: sku.availableStock > 0 ? 1 : 0,
    createdAt: sku.createdAt,
  }
}

export async function getRelatedProductsForLocal(
  localSku: string,
  categoryId: string | null,
  title: string,
  color: string | null = null,
  size: string | null = null,
  specs: unknown = null,
  limit = 6,
): Promise<ProductTeaser[]> {
  if (!categoryId) return []

  const [locals, imports] = await Promise.all([
    prisma.localSKU.findMany({
      where: { categoryId, sku: { not: localSku } },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
    prisma.aliExpressSKU.findMany({
      where: {
        categoryId,
        isPublished: true,
        importListingPrice: { isStale: false },
      },
      include: { category: true, aliExpressCategory: true, importListingPrice: true },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
  ])

  const currentAttrs = { color, size, specs }
  const candidates: RelatedCandidate[] = []

  for (const product of locals) {
    if (!isCatalogEligible(product)) continue

    candidates.push({
      score: relatedScore(title, currentAttrs, product.title, {
        color: product.color,
        size: product.size,
        specs: product.specs,
      }),
      product: toLocalTeaser(product),
    })
  }

  for (const sku of imports) {
    const product = toImportTeaser(sku)
    if (!product) continue

    candidates.push({
      score: relatedScore(title, currentAttrs, sku.title, {
        color: sku.color,
        size: sku.size,
        specs: sku.specs,
      }),
      product,
    })
  }

  return dedupeAndRank(candidates, limit)
}

export async function getRelatedProductsForImport(
  productId: string,
  categoryKey: string | null,
  title: string,
  color: string | null = null,
  size: string | null = null,
  specs: unknown = null,
  limit = 6,
): Promise<ProductTeaser[]> {
  if (!categoryKey) return []

  const categoryScope = await getStorefrontCategoryFilterScope(categoryKey)
  if (!categoryScope || categoryScope.aliExpressCategoryIds.length === 0) return []

  const imports = await prisma.aliExpressSKU.findMany({
    where: {
      productId: { not: productId },
      aliExpressCategoryId: { in: categoryScope.aliExpressCategoryIds },
      isPublished: true,
      importListingPrice: { isStale: false },
    },
    include: { category: true, aliExpressCategory: true, importListingPrice: true },
    orderBy: { createdAt: 'desc' },
    take: 80,
  })

  const currentAttrs = { color, size, specs }
  const candidates = imports
    .map((sku) => {
      const product = toImportTeaser(sku)
      if (!product) return null

      return {
        score: relatedScore(title, currentAttrs, sku.title, {
          color: sku.color,
          size: sku.size,
          specs: sku.specs,
        }),
        product,
      }
    })
    .filter((candidate): candidate is RelatedCandidate => candidate !== null)

  return dedupeAndRank(candidates, limit)
}

export async function getComparableImportsForLocal(
  localSkuId: string,
  limit = 4,
): Promise<ProductTeaser[]> {
  const matches = await prisma.sKUMatch.findMany({
    where: {
      localSkuId,
      status: { in: ['AUTO_MATCHED', 'MANUAL_CONFIRMED'] },
      aliExpressSku: {
        isPublished: true,
        importListingPrice: { isStale: false },
      },
    },
    include: {
      aliExpressSku: {
        include: { category: true, aliExpressCategory: true, importListingPrice: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit * 2,
  })

  const result: ProductTeaser[] = []
  const seenProducts = new Set<string>()

  for (const match of matches) {
    const sku = match.aliExpressSku
    const product = toImportTeaser(sku)
    if (!product) continue

    const key = sku.productId
    if (seenProducts.has(key)) continue
    seenProducts.add(key)
    result.push(product)

    if (result.length >= limit) break
  }

  return result
}

export async function getComparableLocalsForImportProduct(
  productId: string,
  limit = 4,
): Promise<ProductTeaser[]> {
  const matchRows = await prisma.sKUMatch.findMany({
    where: {
      aliExpressSku: { productId },
      status: { in: CONFIRMED_MATCH_STATUSES },
    },
    include: { localSku: { include: { category: true } } },
    orderBy: { updatedAt: 'desc' },
    take: limit * 2,
  })

  const result: ProductTeaser[] = []
  const seenLocals = new Set<string>()

  for (const match of matchRows) {
    if (!isCatalogEligible(match.localSku)) continue
    if (seenLocals.has(match.localSku.sku)) continue
    seenLocals.add(match.localSku.sku)
    result.push(toLocalTeaser(match.localSku))

    if (result.length >= limit) break
  }

  return result
}

export async function getComparableLocalsForImport(
  productId: string,
  skuId: string,
  limit = 4,
): Promise<ProductTeaser[]> {
  const matchRows = await prisma.sKUMatch.findMany({
    where: {
      aliExpressSku: { productId, skuId },
      status: { in: CONFIRMED_MATCH_STATUSES },
    },
    include: { localSku: { include: { category: true } } },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })

  return matchRows
    .filter((match) => isCatalogEligible(match.localSku))
    .map((match) => toLocalTeaser(match.localSku))
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
