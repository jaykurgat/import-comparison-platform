import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDarajaCallback } from '@/lib/payments/daraja'
import { createAliExpressDsOrder } from '@/lib/aliexpress/order'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const callback = parseDarajaCallback(payload)

    const payment = await prisma.importPayment.findUnique({
      where: { checkoutRequestId: callback.checkoutRequestId },
    })

    if (!payment) return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    if (payment.status === 'PAID' && callback.resultCode === 0) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Already processed' })
    }

    if (callback.resultCode !== 0) {
      await prisma.$transaction([
        prisma.importPayment.update({ where: { id: payment.id }, data: { status: 'FAILED' } }),
        prisma.importOrder.update({
          where: { id: payment.orderId },
          data: { status: 'FAILED', errorMessage: callback.resultDescription },
        }),
      ])
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    const order = await prisma.importOrder.findUnique({
      where: { id: payment.orderId },
      include: { items: true },
    })
    if (!order) return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })

    await prisma.$transaction([
      prisma.importPayment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          mpesaReceiptNumber: callback.mpesaReceiptNumber,
          merchantRequestId: callback.merchantRequestId,
        },
      }),
      prisma.importOrder.update({
        where: { id: order.id },
        data: { status: 'SUBMITTING', errorMessage: null },
      }),
    ])

    try {
      const supplierSkus = await prisma.aliExpressSKU.findMany({
        where: { id: { in: order.items.map((item) => item.aliExpressSkuId) } },
      })
      const skuById = new Map(supplierSkus.map((sku) => [sku.id, sku]))

      const created = await createAliExpressDsOrder({
        outOrderId: order.outOrderId,
        address: {
          country: order.country,
          province: order.province,
          city: order.city,
          address: order.address,
          address2: order.address2 ?? undefined,
          full_name: order.fullName ?? undefined,
          mobile_no: order.mobileNo ?? undefined,
          phone_number: order.mobileNo ?? undefined,
          phone_country: '254',
          zip: order.zip ?? undefined,
        },
        items: order.items.map((item) => {
          const supplierSku = skuById.get(item.aliExpressSkuId)
          if (!supplierSku) throw new Error('Supplier SKU ' + item.aliExpressSkuId + ' is no longer available.')
          return {
            product_count: item.quantity,
            product_id: Number(item.productId),
            sku_attr: supplierSku.skuCode ?? item.skuId,
          }
        }),
        payCurrency: 'USD',
        tryToPay: false,
        businessModel: 'retail',
      })

      await prisma.importOrder.update({
        where: { id: order.id },
        data: { status: 'SUBMITTED', supplierOrderIds: created.orderIds },
      })
    } catch (error) {
      await prisma.importOrder.update({
        where: { id: order.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      })
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch {
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}