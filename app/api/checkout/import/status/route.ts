import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get('orderId')?.trim()
  if (!orderId) return NextResponse.json({ error: 'orderId is required.' }, { status: 400 })

  const order = await prisma.importOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      errorMessage: true,
      customerTotal: true,
      currency: true,
      supplierOrderIds: true,
      items: { select: { productId: true, skuId: true, quantity: true, unitSellPrice: true, aliExpressSkuId: true } },
      payment: { select: { status: true, mpesaReceiptNumber: true, paidAt: true } },
    },
  })

  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  return NextResponse.json(
    { ...order, customerTotal: Number(order.customerTotal), items: order.items.map((item) => ({ item_id: `${item.productId}-${item.skuId}`, item_name: `Imported product ${item.productId}`, quantity: item.quantity, price: Number(item.unitSellPrice), currency: order.currency })) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}