export function canPublishSupplierSku(input: {
  stock: number
  hasSellPrice: boolean
  priceIsStale: boolean
}): boolean {
  return input.stock > 0 && input.hasSellPrice && !input.priceIsStale
}
