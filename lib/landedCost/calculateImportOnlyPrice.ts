import { prisma } from '../prisma'
import { getAliExpressProduct } from '../aliexpress/product'
import { getAliExpressFreight } from '../aliexpress/freight'
import { getUsdToKesRate } from '../fx/getExchangeRate'
import { getMarkupForLandedCost } from '../pricing/getMarkupForLandedCost'

/**
 * Computes a sell price for a STANDALONE AliExpress product — no local
 * match involved at all. Same landed-cost math and markup tiers as
 * calculateLandedCost.ts, but with nothing to compare against, so there's
 * no renderMode/comparison — just a straightforward cost+markup price for
 * a product being sold on its own.
 *
 * NOTE: some fetch/calculation logic here intentionally duplicates
 * calculateLandedCost.ts rather than being refactored into a shared
 * helper — that file is already tested and working against real data, and
 * refactoring it purely for DRY-ness right now risks breaking something
 * that works. Worth revisiting if these two diverge further or a third
 * use case appears.
 *
 * Same known gaps as calculateLandedCost.ts: estimatedTaxes is always 0,
 * only USD->KES is supported — see that file's comments for why.
 */

export interface ImportOnlyPriceResult {
  productId: string
  skuId: string
  title: string
  imageUrls: string[]
  color: string | null
  size: string | null
  landedImportPrice: number // KES, true cost before markup
  sellPrice: number // KES, what the customer pays
  markup: number
  isStale: boolean
  priceDataAsOf: Date
}

export async function calculateImportOnlyPrice(
  productId: string,
  skuId: string
): Promise<ImportOnlyPriceResult> {
  const productResult = await getAliExpressProduct(productId, 'KE')
  const matchedRemoteSku = productResult.data.skus.find((s) => s.skuId === skuId)
  if (!matchedRemoteSku) {
    throw new Error(
      `AliExpress SKU ${skuId} no longer appears in product ${productId}'s current variant list.`
    )
  }
  if (matchedRemoteSku.currency !== 'USD') {
    throw new Error(
      `Unsupported AliExpress currency "${matchedRemoteSku.currency}" — only USD is currently supported.`
    )
  }

  const freightResult = await getAliExpressFreight({ productId, skuId, shipToCountry: 'KE' })
  const chosenFreightOption = freightResult.data.options[0]
  if (!chosenFreightOption) {
    throw new Error(`No freight options available for product ${productId}/sku ${skuId} to KE.`)
  }
  if (chosenFreightOption.currency !== 'USD') {
    throw new Error(
      `Unsupported freight currency "${chosenFreightOption.currency}" — only USD is currently supported.`
    )
  }

  const fxResult = await getUsdToKesRate()

  const estimatedTaxesUsd = 0 // known gap — see lib/aliexpress/freight.ts "KNOWN GAPS"

  const itemPriceUsd = matchedRemoteSku.itemPrice
  const freightUsd = chosenFreightOption.freeShipping ? 0 : chosenFreightOption.freightCost
  const exchangeRate = fxResult.data

  const landedImportPrice = Math.round((itemPriceUsd + freightUsd + estimatedTaxesUsd) * exchangeRate)
  const markup = getMarkupForLandedCost(landedImportPrice)
  const sellPrice = landedImportPrice + markup

  const isStale = productResult.isStale || freightResult.isStale || fxResult.source === 'fallback'
  const priceDataAsOf = [productResult.asOf, freightResult.asOf, fxResult.asOf].reduce((oldest, current) =>
    current < oldest ? current : oldest
  )

  const aliExpressSku = await prisma.aliExpressSKU.findUnique({
    where: { productId_skuId: { productId, skuId } },
  })

  if (aliExpressSku) {
    await prisma.importListingPrice.upsert({
      where: { aliExpressSkuId: aliExpressSku.id },
      create: {
        aliExpressSkuId: aliExpressSku.id,
        landedImportPrice,
        sellPrice,
        markup,
        priceDataAsOf,
        isStale,
      },
      update: { landedImportPrice, sellPrice, markup, priceDataAsOf, isStale },
    })
  } else {
    console.warn(
      `[calculateImportOnlyPrice] No AliExpressSKU found for productId=${productId}, skuId=${skuId} — ` +
        `pricing computed but not persisted. Call getAliExpressProduct for this product first.`
    )
  }

  return {
    productId,
    skuId,
    title: productResult.data.title,
    imageUrls: productResult.data.imageUrls,
    color: matchedRemoteSku.color ?? null,
    size: matchedRemoteSku.size ?? null,
    landedImportPrice,
    sellPrice,
    markup,
    isStale,
    priceDataAsOf,
  }
}
