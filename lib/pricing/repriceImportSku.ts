import { prisma } from '../prisma'
import { getUsdToKesRate } from '../fx/getExchangeRate'
import { getMarkupForLandedCost } from './getMarkupForLandedCost'
import { getAliExpressFreight } from '../aliexpress/freight'

export interface RepriceImportSkuResult {
  productId: string
  skuId: string
  landedImportPrice: number
  sellPrice: number
  markup: number
  isStale: boolean
  freeShipping: boolean
  priceDataAsOf: Date
}

/**
 * Reprices one persisted AliExpress SKU.
 *
 * The customer price includes the AliExpress item price plus the selected
 * shipping cost. The combined USD cost is converted to KES, then the tiered
 * markup is applied to that landed cost. Because shipping is included in the
 * displayed selling price, imported products are presented as Free Shipping.
 */
export async function repriceImportSku(
  productId: string,
  skuId: string,
): Promise<RepriceImportSkuResult> {
  const sku = await prisma.aliExpressSKU.findUnique({
    where: { productId_skuId: { productId, skuId } },
  })

  if (!sku) {
    throw new Error(`AliExpress SKU ${productId}/${skuId} not found.`)
  }

  if (sku.currency !== 'USD') {
    throw new Error(
      `Unsupported AliExpress SKU currency "${sku.currency}" — only USD is currently supported.`,
    )
  }

  // Shipping is included in the customer's final selling price. The freight
  // query is requested in the SKU currency (USD), so the returned freight
  // amount is added to the item price before FX conversion and markup.
  let shippingCostUsd = 0
  let freightAsOf = sku.updatedAt
  try {
    const freight = await getAliExpressFreight({
      productId,
      skuId,
      shipToCountry: 'KE',
      quantity: 1,
      currency: sku.currency,
    })
    freightAsOf = freight.asOf
    shippingCostUsd = Number(freight.data.options[0]?.freightCost ?? 0)
    if (!Number.isFinite(shippingCostUsd) || shippingCostUsd < 0) {
      shippingCostUsd = 0
    }
  } catch (error) {
    // If no shipping amount is available, keep the shipping component at zero
    // rather than blocking the import repricing operation.
    console.warn(
      `[repriceImportSku] No shipping cost available for ${productId}/${skuId}; treating as free shipping.`,
      error,
    )
  }

  const fx = await getUsdToKesRate()
  const itemPriceUsd = Number(sku.itemPrice)
  const totalImportCostUsd = itemPriceUsd + shippingCostUsd
  const landedImportPrice = Math.round(totalImportCostUsd * fx.data)
  const markup = getMarkupForLandedCost(landedImportPrice)
  const sellPrice = landedImportPrice + markup
  const freeShipping = true

  const priceDataAsOf = [sku.updatedAt, freightAsOf, fx.asOf].reduce(
    (oldest, current) => (current < oldest ? current : oldest),
  )
  const isStale = fx.source === 'fallback'

  await prisma.importListingPrice.upsert({
    where: { aliExpressSkuId: sku.id },
    create: {
      aliExpressSkuId: sku.id,
      landedImportPrice,
      sellPrice,
      markup,
      priceDataAsOf,
      isStale,
      freeShipping,
    },
    update: {
      landedImportPrice,
      sellPrice,
      markup,
      priceDataAsOf,
      freeShipping,
      isStale,
    },
  })

  return {
    productId,
    skuId,
    landedImportPrice,
    sellPrice,
    markup,
    isStale,
    freeShipping,
    priceDataAsOf,
  }
}
