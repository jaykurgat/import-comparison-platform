import { prisma } from '@/lib/prisma'
import { getAliExpressFreight } from '@/lib/aliexpress/freight'
import { resolveAliExpressAddress } from '@/lib/aliexpress/addressResolver'
import { createAliExpressDsOrder } from '@/lib/aliexpress/order'

export interface ImportCheckoutInput {
  productId: string
  skuId: string
  quantity: number
  fullName: string
  mobileNo: string
  country: string
  province: string
  city: string
  address: string
  address2?: string
  zip?: string
  placeOrder?: boolean
}

export interface ImportCheckoutResult {
  orderId: string
  status: 'READY' | 'SUBMITTED'
  customerTotal: number
  currency: string
  freight: number
  freightCurrency: string
  etaMinDays: number
  etaMaxDays: number
  supplierOrderIds: string[]
}

export async function createImportCheckout(input: ImportCheckoutInput): Promise<ImportCheckoutResult> {
  validateInput(input)

  const sku = await prisma.aliExpressSKU.findUnique({
    where: { productId_skuId: { productId: input.productId, skuId: input.skuId } },
    include: { importListingPrice: true },
  })

  if (!sku || !sku.isPublished || sku.availableStock < input.quantity || !sku.importListingPrice) {
    throw new Error('This import listing is unavailable, unpublished, out of stock, or not priced.')
  }

  if (sku.currency !== 'USD' || sku.importListingPrice.currency !== 'KES') {
    throw new Error('Only USD supplier pricing with KES storefront pricing is currently supported.')
  }

  const resolved = await resolveAliExpressAddress({
    countryCode: input.country,
    province: input.province,
    city: input.city,
  })

  const freight = await getAliExpressFreight({
    productId: input.productId,
    skuId: input.skuId,
    shipToCountry: resolved.country,
    quantity: input.quantity,
    currency: 'USD',
  })

  if (freight.data.options.length === 0) {
    throw new Error('No valid AliExpress delivery option is available for this address.')
  }

  const option = freight.data.options[0]
  if (option.currency !== 'USD') {
    throw new Error('The selected delivery quote is not in USD.')
  }

  const order = await prisma.importOrder.create({
    data: {
      outOrderId: `ICP-${crypto.randomUUID()}`,
      country: resolved.country,
      province: resolved.province,
      city: resolved.city,
      address: input.address.trim(),
      address2: input.address2?.trim() || null,
      fullName: input.fullName.trim(),
      mobileNo: input.mobileNo.trim(),
      zip: input.zip?.trim() || null,
      customerTotal: Number(sku.importListingPrice.sellPrice) * input.quantity,
      items: {
        create: {
          aliExpressSkuId: sku.id,
          productId: sku.productId,
          skuId: sku.skuId,
          quantity: input.quantity,
          unitSellPrice: sku.importListingPrice.sellPrice,
        },
      },
    },
  })

  if (!input.placeOrder) {
    return {
      orderId: order.id,
      status: 'READY',
      customerTotal: Number(sku.importListingPrice.sellPrice) * input.quantity,
      currency: sku.importListingPrice.currency,
      freight: option.freightCost,
      freightCurrency: option.currency,
      etaMinDays: option.minDays,
      etaMaxDays: option.maxDays,
      supplierOrderIds: [],
    }
  }

  try {
    const supplier = await createAliExpressDsOrder({
      outOrderId: order.outOrderId,
      address: {
        address: input.address.trim(),
        ...(input.address2?.trim() ? { address2: input.address2.trim() } : {}),
        city: resolved.city,
        contact_person: input.fullName.trim(),
        country: resolved.country,
        full_name: input.fullName.trim(),
        mobile_no: input.mobileNo.trim(),
        province: resolved.province,
        ...(input.zip?.trim() ? { zip: input.zip.trim() } : {}),
      },
      items: [{
        product_count: input.quantity,
        product_id: Number(input.productId),
        ...(option.code ? { logistics_service_name: option.code } : {}),
      }],
      payCurrency: 'USD',
      tryToPay: false,
    })

    await prisma.importOrder.update({
      where: { id: order.id },
      data: { status: 'SUBMITTED', supplierOrderIds: supplier.orderIds },
    })

    return {
      orderId: order.id,
      status: 'SUBMITTED',
      customerTotal: Number(sku.importListingPrice.sellPrice) * input.quantity,
      currency: sku.importListingPrice.currency,
      freight: option.freightCost,
      freightCurrency: option.currency,
      etaMinDays: option.minDays,
      etaMaxDays: option.maxDays,
      supplierOrderIds: supplier.orderIds,
    }
  } catch (error) {
    await prisma.importOrder.update({
      where: { id: order.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    })
    throw error
  }
}

function validateInput(input: ImportCheckoutInput): void {
  if (!input.productId.trim() || !input.skuId.trim()) throw new Error('Product and SKU are required.')
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 20) throw new Error('Quantity must be an integer from 1 to 20.')
  if (!input.fullName.trim()) throw new Error('Full name is required.')
  if (!input.mobileNo.trim()) throw new Error('Mobile number is required.')
  if (!input.country.trim()) throw new Error('Country is required.')
  if (!input.province.trim()) throw new Error('Province/state is required.')
  if (!input.city.trim()) throw new Error('City is required.')
  if (!input.address.trim()) throw new Error('Address is required.')
}
