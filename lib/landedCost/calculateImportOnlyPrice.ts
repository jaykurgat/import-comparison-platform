import { getAliExpressProduct } from '../aliexpress/product'
import { repriceImportSku } from '../pricing/repriceImportSku'

/**
 * Computes and persists the standalone AliExpress selling price for one SKU.
 *
 * The pricing source of truth is repriceImportSku: shipping is never added to
 * the customer price, and its simple shipping-cost check persists the
 * ImportListingPrice.freeShipping flag used by the storefront.
 */
export interface ImportOnlyPriceResult {
  productId: string
  skuId: string
  title: string
  imageUrls: string[]
  color: string | null
  size: string | null
  landedImportPrice: number
  sellPrice: number
  markup: number
  isStale: boolean
  freeShipping: boolean
  priceDataAsOf: Date
}

export async function calculateImportOnlyPrice(
  productId: string,
  skuId: string,
): Promise<ImportOnlyPriceResult> {
  const productResult = await getAliExpressProduct(productId, 'KE')
  const matchedRemoteSku = productResult.data.skus.find((s) => s.skuId === skuId)

  if (!matchedRemoteSku) {
    throw new Error(
      `AliExpress SKU ${skuId} no longer appears in product ${productId}'s current variant list.`,
    )
  }

  if (matchedRemoteSku.currency !== 'USD') {
    throw new Error(
      `Unsupported AliExpress currency "${matchedRemoteSku.currency}" — only USD is currently supported.`,
    )
  }

  // Keep all standalone-import pricing on the same path as catalog repricing.
  // This is important because repriceImportSku also persists freeShipping.
  const priced = await repriceImportSku(productId, skuId)

  return {
    productId,
    skuId,
    title: productResult.data.title,
    imageUrls: productResult.data.imageUrls,
    color: matchedRemoteSku.color ?? null,
    size: matchedRemoteSku.size ?? null,
    landedImportPrice: priced.landedImportPrice,
    sellPrice: priced.sellPrice,
    markup: priced.markup,
    isStale: priced.isStale,
    freeShipping: priced.freeShipping,
    priceDataAsOf: priced.priceDataAsOf,
  }
}
