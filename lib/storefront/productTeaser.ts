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
  variantCount: number
  availableVariantCount: number
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
      variantCount: 1,
      availableVariantCount: localSku.inStock ? 1 : 0,
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
    variantCount: 1,
    availableVariantCount: localSku.inStock ? 1 : 0,
    createdAt: localSku.createdAt,
  }
}

export interface StandaloneImportSkuLike {
  productId: string
  skuId: string
  title: string
  imageUrls: string[]
  currency: string
  availableStock: number
  createdAt: Date
  category?: { name: string } | null
  aliExpressCategory?: { name: string } | null
  importListingPrice: {
    sellPrice: { toString(): string }
    currency: string
  } | null
}

export function toImportProductTeaser(skus: StandaloneImportSkuLike[]): ProductTeaser | null {
  if (skus.length === 0) return null

  const priced = skus
    .filter((sku) => sku.importListingPrice)
    .map((sku) => ({
      sku,
      sellPrice: Number(sku.importListingPrice!.sellPrice),
      currency: sku.importListingPrice!.currency,
    }))
    .filter((item) => Number.isFinite(item.sellPrice) && item.sellPrice > 0)

  if (priced.length === 0) return null

  const lowest = [...priced].sort((a, b) => a.sellPrice - b.sellPrice)[0]
  const first = skus[0]
  const availableVariantCount = skus.filter((sku) => sku.availableStock > 0).length

  return {
    sku: `import-${first.productId}`,
    href: `/import/${encodeURIComponent(first.productId)}`,
    title: first.title,
    imageUrl: skus.flatMap((sku) => sku.imageUrls).find(Boolean) ?? null,
    price: lowest.sellPrice,
    currency: lowest.currency,
    hasDeal: false,
    savingsAmount: null,
    source: 'import',
    categoryName: skus.find((sku) => sku.aliExpressCategory?.name)?.aliExpressCategory?.name
      ?? skus.find((sku) => sku.category?.name)?.category?.name
      ?? null,
    inStock: availableVariantCount > 0,
    variantCount: skus.length,
    availableVariantCount,
    createdAt: new Date(Math.max(...skus.map((sku) => sku.createdAt.getTime()))),
  }
}
