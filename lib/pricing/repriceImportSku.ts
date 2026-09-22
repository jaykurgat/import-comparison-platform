import { prisma } from '../prisma'
import { getUsdToKesRate } from '../fx/getExchangeRate'
import { getMarkupForLandedCost } from './getMarkupForLandedCost'

export interface RepriceImportSkuResult {
  productId: string
  skuId: string
  landedImportPrice: number
  sellPrice: number
  markup: number
  isStale: boolean
  priceDataAsOf: Date
}

/**
 * Reprices one persisted AliExpress SKU from the latest durable product and
 * freight snapshots. It deliberately does not invent tax/duty values:
 * estimatedTaxes remains zero until a verified destination-tax source exists.
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

  const freight = await prisma.freightSnapshot.findFirst({
    where: {
      aliExpressSkuId: sku.id,
      destination: 'KE',
    },
    orderBy: { recordedAt: 'desc' },
  })

  if (!freight) {
    throw new Error(
      `No Kenya freight snapshot exists for AliExpress SKU ${productId}/${skuId}.`,
    )
  }

  if (freight.currency !== 'USD') {
    throw new Error(
      `Unsupported freight currency "${freight.currency}" — only USD is currently supported.`,
    )
  }

  const fx = await getUsdToKesRate()
  const itemPriceUsd = Number(sku.itemPrice)
  const freightUsd = Number(freight.freightCost)
  const landedImportPrice = Math.round((itemPriceUsd + freightUsd) * fx.data)
  const markup = getMarkupForLandedCost(landedImportPrice)
  const sellPrice = landedImportPrice + markup

  const priceDataAsOf = [sku.updatedAt, freight.recordedAt, fx.asOf].reduce(
    (oldest, current) => (current < oldest ? current : oldest),
  )
  const isStale =
    freight.expiresAt <= new Date() || fx.source === 'fallback'

  await prisma.importListingPrice.upsert({
    where: { aliExpressSkuId: sku.id },
    create: {
      aliExpressSkuId: sku.id,
      landedImportPrice,
      sellPrice,
      markup,
      priceDataAsOf,
      isStale,
    },
    update: {
      landedImportPrice,
      sellPrice,
      markup,
      priceDataAsOf,
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
    priceDataAsOf,
  }
}
