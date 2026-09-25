import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAliExpressFreight } from '@/lib/aliexpress/freight'
import { createDarajaStkPush } from '@/lib/payments/daraja'
import { createOrderAccessToken } from '@/lib/checkout/orderAccess'

export const runtime = 'nodejs'

type CartInput = { kind: 'local' | 'supplier'; productId?: string; skuId?: string; sku?: string; quantity: number }

export async function POST(request: Request) {
  try {
    const body = await request.json() as { items?: CartInput[]; fullName?: string; mobileNo?: string; country?: string; province?: string; city?: string; address?: string; address2?: string; zip?: string }
    const items = body.items ?? []
    if (!items.length) throw new Error('Your cart is empty.')
    if (items.length > 20) throw new Error('Your cart contains too many different products.')
    const fullName = String(body.fullName ?? '').trim()
    const mobileNo = String(body.mobileNo ?? '').trim()
    const country = String(body.country ?? 'KE').trim()
    const province = String(body.province ?? '').trim()
    const city = String(body.city ?? '').trim()
    const address = String(body.address ?? '').trim()
    const address2 = String(body.address2 ?? '').trim()
    const zip = String(body.zip ?? '').trim()
    if (!fullName || !mobileNo || !province || !city || !address) throw new Error('Please complete your delivery details.')
    const orderItems: Array<{ aliExpressSkuId?: string; localSkuId?: string; productId: string; skuId: string; quantity: number; unitSellPrice: number }> = []
    for (const item of items) {
      const quantity = Math.min(20, Math.max(1, Math.trunc(Number(item.quantity) || 0)))
      if (!quantity) throw new Error('Invalid quantity.')
      if (item.kind === 'local') {
        const sku = await prisma.localSKU.findUnique({ where: { sku: String(item.sku ?? '') } })
        if (!sku || !sku.inStock) throw new Error('One of the local products is unavailable.')
        orderItems.push({ localSkuId: sku.id, productId: sku.sku, skuId: sku.sku, quantity, unitSellPrice: Number(sku.currentPrice) })
        continue
      }
      const productId = String(item.productId ?? '')
      const skuId = String(item.skuId ?? '')
      const sku = await prisma.aliExpressSKU.findUnique({ where: { productId_skuId: { productId, skuId } }, include: { importListingPrice: true } })
      if (!sku || !sku.isPublished || sku.availableStock < quantity || !sku.importListingPrice || sku.importListingPrice.isStale) throw new Error('One of the supplier products is no longer available at the current price.')
      const freight = await getAliExpressFreight({ productId, skuId, shipToCountry: country, quantity, currency: 'USD' })
      if (!freight.data.options[0] || freight.data.options[0].currency !== 'USD') throw new Error('Delivery is not currently available for one of the supplier products.')
      orderItems.push({ aliExpressSkuId: sku.id, productId, skuId, quantity, unitSellPrice: Number(sku.importListingPrice.sellPrice) })
    }
    const customerTotal = orderItems.reduce((sum, item) => sum + item.unitSellPrice * item.quantity, 0)
    const order = await prisma.importOrder.create({ data: { outOrderId: 'KC-' + crypto.randomUUID().slice(0, 8).toUpperCase(), status: 'PAYMENT_PENDING', country, province, city, address, address2: address2 || null, fullName, mobileNo, zip: zip || null, customerTotal, items: { create: orderItems } } })
    try {
      const payment = await createDarajaStkPush({ amountKes: Math.round(customerTotal), phoneNumber: mobileNo, accountReference: order.outOrderId, transactionDesc: 'KijijiCart order' })
      await prisma.importPayment.create({ data: { orderId: order.id, provider: 'DARAJA', status: 'PENDING', checkoutRequestId: payment.checkoutRequestId, merchantRequestId: payment.merchantRequestId, amount: Math.round(customerTotal), currency: 'KES' } })
      return NextResponse.json({ orderId: order.id, accessToken: createOrderAccessToken(order.id), checkoutUrl: '/checkout/import/success?orderId=' + encodeURIComponent(order.id), paymentMessage: payment.customerMessage ?? 'Check your phone and enter your M-PESA PIN to complete payment.' })
    } catch (error) {
      await prisma.importOrder.update({ where: { id: order.id }, data: { status: 'FAILED', errorMessage: error instanceof Error ? error.message : String(error) } })
      throw error
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Checkout failed.' }, { status: 400 })
  }
}