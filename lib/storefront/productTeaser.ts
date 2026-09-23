/**
 * Shared presentation shape for local and standalone import products.
 * Matching remains enrichment; this mapper never decides catalog eligibility.
 */

export type ProductSource = 'local' | 'import'

export interface ProductTeaser {
  sku: string
  href: string
  title: string
  imageUrl: string | null
  price: number
  currency: string
  hasDeal: boolean
  savingsAmount: number | null
  source: ProductSource
  categoryName: string | null
  inStock: boolean
  createdAt: Date
}

interface LocalSkuLike {
  sku: string
  title: string
  imageUrls: string[]
  currentPrice: { toString(): string }
  currency: string
  category?: { name: string } | null
  inStock: boolean
  createdAt: Date
}

interface MatchWithComparisonLike {
  comparison: {
    renderMode: string
    sellPrice: { toString(): string }
    localTotalPrice: { toString(): string }
  } | null
}

export function toProductTeaser(localSku: LocalSkuLike, matches: MatchWithComparisonLike[]): ProductTeaser {
  const dealMatch = matches.find((m) => m.comparison?.renderMode === 'IMPORT_ADVANTAGE')

  if (dealMatch?.comparison) {
    const sellPrice = Number(dealMatch.comparison.sellPrice)
    const localTotalPrice = Number(dealMatch.comparison.localTotalPrice)
    return {
      sku: localSku.sku,
      href: `/product/${encodeURIComponent(localSku.sku)}`,
      title: localSku.title,
      imageUrl: localSku.imageUrls[0] ?? null,
      price: sellPrice,
      currency: localSku.currency,
      hasDeal: true,
      savingsAmount: Math.max(0, localTotalPrice - sellPrice),
      source: 'local',
      categoryName: localSku.category?.name ?? null,
      inStock: localSku.inStock,
      createdAt: localSku.createdAt,
    }
  }

  return {
    sku: localSku.sku,
    href: `/product/${encodeURIComponent(localSku.sku)}`,
    title: localSku.title,
    imageUrl: localSku.imageUrls[0] ?? null,
    price: Number(localSku.currentPrice),
    currency: localSku.currency,
    hasDeal: false,
    savingsAmount: null,
    source: 'local',
    categoryName: localSku.category?.name ?? null,
    inStock: localSku.inStock,
    createdAt: localSku.createdAt,
  }
}

interface StandaloneImportSkuLike {
  productId: string
  skuId: string
  title: string
  imageUrls: string[]
  currency: string
  availableStock: number
  createdAt: Date
  category?: { name: string } | null
  importListingPrice: {
    sellPrice: { toString(): string }
    currency: string
  } | null
}

export function toImportProductTeaser(sku: StandaloneImportSkuLike): ProductTeaser | null {
  if (!sku.importListingPrice) return null

  return {
    sku: `${sku.productId}-${sku.skuId}`,
    href: `/import/${encodeURIComponent(sku.productId)}/${encodeURIComponent(sku.skuId)}`,
    title: sku.title,
    imageUrl: sku.imageUrls[0] ?? null,
    price: Number(sku.importListingPrice.sellPrice),
    currency: sku.importListingPrice.currency,
    hasDeal: false,
    savingsAmount: null,
    source: 'import',
    categoryName: sku.category?.name ?? null,
    inStock: sku.availableStock > 0,
    createdAt: sku.createdAt,
  }
}
