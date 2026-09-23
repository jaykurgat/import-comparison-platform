export function canPublishSupplierSku(input: {
  hasSellPrice: boolean
  priceIsStale: boolean
  hasTitle: boolean
  hasImage: boolean
}): boolean {
  return input.hasSellPrice && !input.priceIsStale && input.hasTitle && input.hasImage
}
