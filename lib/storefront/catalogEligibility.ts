/**
 * Storefront eligibility is deliberately separate from matching eligibility.
 * A local product can be listed without an AliExpress match, but it must have
 * enough trustworthy information to be useful to a shopper.
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

function hasUsableImage(imageUrls: string[]): boolean {
  return imageUrls.some((url) => {
    const trimmed = url.trim()
    return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')
  })
}

export function isCatalogEligible(product: CatalogEligibilityInput): boolean {
  const price = Number(product.currentPrice)

  return (
    hasMeaningfulText(product.title) &&
    hasMeaningfulText(product.description) &&
    hasUsableImage(product.imageUrls) &&
    Number.isFinite(price) &&
    price > 0 &&
    hasMeaningfulText(product.currency)
  )
}
