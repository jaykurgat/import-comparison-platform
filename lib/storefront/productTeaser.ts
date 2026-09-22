/**
 * Shared shape + mapping logic used by both the homepage's featured
 * section and the full product listing page — so a product card means
 * the same thing everywhere, not two slightly different implementations.
 *
 * Per the earlier design decision: listing/grid views show a lightweight
 * PRICE + SAVINGS TEASER only, never the full comparison breakdown — that
 * lives on the product detail page.
 */

export interface ProductTeaser {
  sku: string
  href: string // where clicking this card navigates — differs for local vs standalone import products
  title: string
  imageUrl: string | null
  price: number // the best available price — sellPrice if a deal exists, otherwise the local price
  currency: string
  hasDeal: boolean
  savingsAmount: number | null // localTotalPrice - sellPrice, only when hasDeal is true
}

interface LocalSkuLike {
  sku: string
  title: string
  imageUrls: string[]
  currentPrice: { toString(): string }
  currency: string
}

interface MatchWithComparisonLike {
  comparison: {
    renderMode: string
    sellPrice: { toString(): string }
    localTotalPrice: { toString(): string }
  } | null
}

export function toProductTeaser(
  localSku: LocalSkuLike,
  matches: MatchWithComparisonLike[]
): ProductTeaser {
  const dealMatch = matches.find((m) => m.comparison?.renderMode === 'IMPORT_ADVANTAGE')

  if (dealMatch?.comparison) {
    const sellPrice = Number(dealMatch.comparison.sellPrice)
    const localTotalPrice = Number(dealMatch.comparison.localTotalPrice)
    return {
      sku: localSku.sku,
      href: `/product/${localSku.sku}`,
      title: localSku.title,
      imageUrl: localSku.imageUrls[0] ?? null,
      price: sellPrice,
      currency: localSku.currency,
      hasDeal: true,
      savingsAmount: localTotalPrice - sellPrice,
    }
  }

  return {
    sku: localSku.sku,
    href: `/product/${localSku.sku}`,
    title: localSku.title,
    imageUrl: localSku.imageUrls[0] ?? null,
    price: Number(localSku.currentPrice),
    currency: localSku.currency,
    hasDeal: false,
    savingsAmount: null,
  }
}

interface StandaloneImportSkuLike {
  productId: string
  skuId: string
  title: string
  imageUrls: string[]
  currency: string
  importListingPrice: {
    sellPrice: { toString(): string }
  } | null
}

/**
 * Maps a published, unmatched AliExpressSKU into the same teaser shape.
 * hasDeal/savingsAmount are always false/null here — there's no local
 * price to compare against for a standalone import product.
 */
export function toImportProductTeaser(sku: StandaloneImportSkuLike): ProductTeaser | null {
  if (!sku.importListingPrice) return null // not yet priced — shouldn't normally happen, but don't show a priceless card

  return {
    sku: `${sku.productId}-${sku.skuId}`,
    href: `/import/${sku.productId}/${sku.skuId}`,
    title: sku.title,
    imageUrl: sku.imageUrls[0] ?? null,
    price: Number(sku.importListingPrice.sellPrice),
    currency: sku.currency === 'USD' ? 'KES' : sku.currency, // displayed price is always the computed KES sellPrice
    hasDeal: false,
    savingsAmount: null,
  }
}
