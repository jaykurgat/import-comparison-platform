import { prisma } from '@/lib/prisma'
import { getAliExpressFreight } from '@/lib/aliexpress/freight'
import { resolveAliExpressAddress } from '@/lib/aliexpress/addressResolver'
import { createStripeCheckoutSession } from '@/lib/payments/stripe'

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
}

export interface ImportCheckoutResult {
  orderId: string
  status: 'PAYMENT_PENDING'
  checkoutUrl: string
  customerTotal: number
  currency: string
  freight: number
  freightCurrency: string
  etaMinDays: number
  etaMaxDays: number
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

  const option = freight.data.options[0]
  if (!option || option.currency !== 'USD') {
    throw new Error('No valid AliExpress delivery option is available for this address.')
  }

  const customerTotal = Number(sku.importListingPrice.sellPrice) * input.quantity
  const order = await prisma.importOrder.create({
    data: {
      outOrderId: `ICP-${crypto.randomUUID()}`,
      status: 'PAYMENT_PENDING',
      country: resolved.country,
      province: resolved.province,
      city: resolved.city,
      address: input.address.trim(),
      address2: input.address2?.trim() || null,
      fullName: input.fullName.trim(),
      mobileNo: input.mobileNo.trim(),
      zip: input.zip?.trim() || null,
      customerTotal,
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
    include: { items: true },
  })

  try {
    const session = await createStripeCheckoutSession({
      orderId: order.id,
      amountKes: Math.round(customerTotal),
      productName: sku.title,
      quantity: input.quantity,
    })

    await prisma.importPayment.create({
      data: {
        orderId: order.id,
        provider: 'STRIPE',
        status: 'PENDING',
        checkoutSessionId: session.id,
        paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        amount: customerTotal,
        currency: 'KES',
      },
    })

    return {
      orderId: order.id,
      status: 'PAYMENT_PENDING',
      checkoutUrl: session.url,
      customerTotal,
      currency: 'KES',
      freight: option.freightCost,
      freightCurrency: option.currency,
      etaMinDays: option.minDays,
      etaMaxDays: option.maxDays,
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
