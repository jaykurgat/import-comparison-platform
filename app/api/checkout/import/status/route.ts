import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'orderId is required.' }, { status: 400 })

  const order = await prisma.importOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      errorMessage: true,
      supplierOrderIds: true,
      payment: { select: { status: true, mpesaReceiptNumber: true } },
    },
  })

  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  return NextResponse.json(order)
}
