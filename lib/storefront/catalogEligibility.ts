/**
 * Storefront eligibility is deliberately separate from matching eligibility.
 * Matching is enrichment only: a valid local product remains listable even
 * when it has no description, image, candidate match, or comparison result.
 *
 * Ingestion rejects only rows that fail the required title/price checks.
 * The storefront therefore uses the same core validity boundary rather than
 * silently dropping otherwise valid local products because presentation data
 * is incomplete.
 */

export interface CatalogEligibilityInput {
  title: string
  description: string | null
  imageUrls: string[]
  currentPrice: { toString(): string } | number
  currency: string
}

function hasMeaningfulText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

export function isCatalogEligible(product: CatalogEligibilityInput): boolean {
  const price = Number(product.currentPrice)

  return (
    hasMeaningfulText(product.title) &&
    Number.isFinite(price) &&
    price > 0 &&
    hasMeaningfulText(product.currency)
  )
}
