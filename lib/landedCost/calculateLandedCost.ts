import { prisma } from '../prisma'
import { getAliExpressProduct } from '../aliexpress/product'
import { getAliExpressFreight } from '../aliexpress/freight'
import { getUsdToKesRate } from '../fx/getExchangeRate'
import { getMarkupForLandedCost } from '../pricing/getMarkupForLandedCost'

/**
 * The core business formula from the original spec:
 *   Landed Import Price = AliExpress Item Price + Freight + Estimated Taxes
 *   Sell Price = Landed Import Price + tiered markup (see lib/pricing/)
 *   IMPORT_ADVANTAGE if Sell Price < Local Total Price, else LOCAL_ONLY
 *
 * IMPORTANT: the render decision compares SELL PRICE (what the customer
 * actually pays, including your markup) against the local price — NOT the
 * raw landed cost. An item could land cheaper than local before markup,
 * but the markup could push it above local. Comparing raw cost would be
 * comparing a number the customer never actually sees.
 *
 * Deliberate design decisions, all flagged rather than silently assumed:
 *
 * 1. Only computes for AUTO_MATCHED or MANUAL_CONFIRMED SKUMatch rows.
 *    NEEDS_REVIEW is excluded on purpose — showing a price comparison for
 *    an unverified match risks showing a wrong comparison to a real user.
 *    A human must confirm the match first.
 *
 * 2. Currency: only USD (AliExpress) -> KES (local) is supported. Any other
 *    currency pair throws rather than guessing a conversion — a wrong FX
 *    assumption would silently corrupt the core render decision.
 *
 * 3. estimatedTaxes is currently always 0 (inherited from the known gap in
 *    lib/aliexpress/freight.ts — AliExpress's freight.query response
 *    doesn't hand us a distinct Kenyan tax figure). This UNDERSTATES the
 *    true landed cost, which means the IMPORT_ADVANTAGE decision is
 *    currently biased toward favoring import more often than it should be.
 *    This is a real limitation, not a rounding error — fix this before
 *    trusting render decisions in production.
 *
 * 4. localTotalPrice is just LocalSKU.currentPrice — does NOT include a
 *    local delivery fee (Jumia's own product pages show these separately,
 *    e.g. KSh 79-400 depending on method), because nothing in the schema
 *    or ingestion captures one yet. This UNDERSTATES the local price,
 *    which — combined with #3 — means BOTH known gaps currently bias
 *    toward showing "import wins" more than a fully accurate calculation
 *    would.
 *
 * 5. Markup is applied PER PRODUCT, using that product's own landed cost —
 *    never based on a cart total. See lib/pricing/getMarkupForLandedCost.ts.
 */

const ELIGIBLE_STATUSES = ['AUTO_MATCHED', 'MANUAL_CONFIRMED']

export interface LandedCostBreakdown {
  itemPriceUsd: number
  freightUsd: number
  estimatedTaxesUsd: number
  exchangeRate: number
  markup: number // KES, flat amount from the tier this product's landed cost fell into
}

export interface LandedCostResult {
  landedImportPrice: number // KES — true cost, before markup
  sellPrice: number // KES — landedImportPrice + markup — what the customer actually pays
  localTotalPrice: number // KES
  renderMode: 'IMPORT_ADVANTAGE' | 'LOCAL_ONLY'
  isStale: boolean
  priceDataAsOf: Date
  breakdown: LandedCostBreakdown
}

export async function calculateLandedCost(skuMatchId: string): Promise<LandedCostResult> {
  const skuMatch = await prisma.sKUMatch.findUnique({
    where: { id: skuMatchId },
    include: { localSku: true, aliExpressSku: true },
  })

  if (!skuMatch) {
    throw new Error(`SKUMatch ${skuMatchId} not found.`)
  }

  if (!ELIGIBLE_STATUSES.includes(skuMatch.status)) {
    throw new Error(
      `SKUMatch ${skuMatchId} has status ${skuMatch.status} — landed cost is only computed for ` +
        `AUTO_MATCHED or MANUAL_CONFIRMED matches. A NEEDS_REVIEW match must be confirmed by a ` +
        `human first (update its status in Prisma Studio, or build the review UI).`
    )
  }

  const { localSku, aliExpressSku } = skuMatch

  // --- AliExpress item price (live, cached) ---
  const productResult = await getAliExpressProduct(aliExpressSku.productId, 'KE')
  const matchedRemoteSku = productResult.data.skus.find((s) => s.skuId === aliExpressSku.skuId)
  if (!matchedRemoteSku) {
    throw new Error(
      `AliExpress SKU ${aliExpressSku.skuId} no longer appears in product ${aliExpressSku.productId}'s ` +
        `current variant list — it may have been discontinued.`
    )
  }
  if (matchedRemoteSku.currency !== 'USD') {
    throw new Error(
      `Unsupported AliExpress currency "${matchedRemoteSku.currency}" — only USD is currently supported.`
    )
  }

  // --- Freight (live, cached) ---
  const freightResult = await getAliExpressFreight({
    productId: aliExpressSku.productId,
    skuId: aliExpressSku.skuId,
    shipToCountry: 'KE',
  })
  const chosenFreightOption = freightResult.data.options[0]
  if (!chosenFreightOption) {
    throw new Error(
      `No freight options available for product ${aliExpressSku.productId}/sku ${aliExpressSku.skuId} ` +
        `to KE — cannot compute landed cost without shipping data.`
    )
  }
  if (chosenFreightOption.currency !== 'USD') {
    throw new Error(
      `Unsupported freight currency "${chosenFreightOption.currency}" — only USD is currently supported.`
    )
  }

  // --- Exchange rate (live, cached) ---
  const fxResult = await getUsdToKesRate()

  // estimatedTaxes: always 0 for now — see class-level comment above.
  const estimatedTaxesUsd = 0

  const itemPriceUsd = matchedRemoteSku.itemPrice
  const freightUsd = chosenFreightOption.freeShipping ? 0 : chosenFreightOption.freightCost
  const exchangeRate = fxResult.data

  const rawLandedImportPrice = (itemPriceUsd + freightUsd + estimatedTaxesUsd) * exchangeRate

  if (localSku.currency !== 'KES') {
    throw new Error(`Unsupported local currency "${localSku.currency}" — only KES is currently supported.`)
  }
  const rawLocalTotalPrice = Number(localSku.currentPrice)

  // KES doesn't practically use cents — round to whole shillings here, at
  // the source, so every consumer (database, future UI, this script) sees
  // consistent whole numbers rather than each having to round separately.
  const landedImportPrice = Math.round(rawLandedImportPrice)
  const localTotalPrice = Math.round(rawLocalTotalPrice)

  const markup = getMarkupForLandedCost(landedImportPrice)
  const sellPrice = landedImportPrice + markup

  const renderMode: 'IMPORT_ADVANTAGE' | 'LOCAL_ONLY' =
    sellPrice < localTotalPrice ? 'IMPORT_ADVANTAGE' : 'LOCAL_ONLY'

  const isStale = productResult.isStale || freightResult.isStale || fxResult.source === 'fallback'
  const priceDataAsOf = [productResult.asOf, freightResult.asOf, fxResult.asOf].reduce((oldest, current) =>
    current < oldest ? current : oldest
  )

  await prisma.comparisonResult.upsert({
    where: { skuMatchId },
    create: { skuMatchId, landedImportPrice, sellPrice, localTotalPrice, renderMode, priceDataAsOf, isStale },
    update: { landedImportPrice, sellPrice, localTotalPrice, renderMode, priceDataAsOf, isStale },
  })

  return {
    landedImportPrice,
    sellPrice,
    localTotalPrice,
    renderMode,
    isStale,
    priceDataAsOf,
    breakdown: { itemPriceUsd, freightUsd, estimatedTaxesUsd, exchangeRate, markup },
  }
}

