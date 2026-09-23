export function canPublishSupplierSku(input: {
  stock: number
  hasSellPrice: boolean
  priceIsStale: boolean
  hasTitle: boolean
  hasImage: boolean
}): boolean {
  return input.stock > 0 && input.hasSellPrice && !input.priceIsStale && input.hasTitle && input.hasImage
}
