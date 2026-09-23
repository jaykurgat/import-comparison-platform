import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDarajaCallback } from '@/lib/payments/daraja'
import { submitPaidImportOrder } from '@/lib/checkout/submitPaidImportOrder'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const callback = parseDarajaCallback(payload)

    const payment = await prisma.importPayment.findUnique({
      where: { checkoutRequestId: callback.checkoutRequestId },
    })

    if (!payment) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    if (payment.status === 'PAID') {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    if (callback.resultCode === 0) {
      await prisma.$transaction([
        prisma.importPayment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            mpesaReceiptNumber: callback.mpesaReceiptNumber,
            ...(callback.merchantRequestId ? { merchantRequestId: callback.merchantRequestId } : {}),
          },
        }),
        prisma.importOrder.updateMany({
          where: { id: payment.orderId, status: 'PAYMENT_PENDING' },
          data: { status: 'PAID', errorMessage: null },
        }),
      ])

      try {
        await submitPaidImportOrder(payment.orderId)
      } catch {
        // The order state is persisted as FAILED by submitPaidImportOrder.
        // Daraja has already received a successful payment callback.
      }
    } else {
      await prisma.$transaction([
        prisma.importPayment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            ...(callback.merchantRequestId ? { merchantRequestId: callback.merchantRequestId } : {}),
          },
        }),
        prisma.importOrder.updateMany({
          where: { id: payment.orderId, status: 'PAYMENT_PENDING' },
          data: {
            status: 'FAILED',
            errorMessage: callback.resultDescription,
          },
        }),
      ])
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (error) {
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: error instanceof Error ? error.message : 'Invalid callback.' },
      { status: 400 },
    )
  }
}
