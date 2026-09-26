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
 * Reprices one persisted AliExpress SKU from the latest durable product and
 * freight snapshots. Shipping is refreshed through the same freight source
 * used by the landed-price calculation, so the displayed free-shipping state
 * and the calculated selling price cannot drift apart.
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

  // Free Shipping is a simple product property. It is determined only by the
  // shipping amount returned by AliExpress: zero/no shipping cost = Free
  // Shipping; a positive shipping cost = no Free Shipping label. Shipping is
  // never added to the customer price.
  let freeShipping = true
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
    const shippingCost = Number(freight.data.options[0]?.freightCost ?? 0)
    freeShipping = shippingCost <= 0
  } catch (error) {
    // No shipping amount available means there is no shipping cost to display.
    // Keep the product marked Free Shipping rather than blocking repricing.
    console.warn(
      `[repriceImportSku] No shipping cost available for ${productId}/${skuId}; treating as free shipping.`,
      error,
    )
  }

  const fx = await getUsdToKesRate()
  const itemPriceUsd = Number(sku.itemPrice)
  const landedImportPrice = Math.round(itemPriceUsd * fx.data)
  const markup = getMarkupForLandedCost(landedImportPrice)
  const sellPrice = landedImportPrice + markup

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
