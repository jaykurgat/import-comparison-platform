import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDarajaCallback } from '@/lib/payments/daraja'
import { submitPaidImportOrder } from '@/lib/checkout/submitPaidImportOrder'

export async function handleDarajaCallback(request: Request): Promise<NextResponse> {
  try {
    const callback = parseDarajaCallback(await request.json())
    const payment = await prisma.importPayment.findUnique({
      where: { checkoutRequestId: callback.checkoutRequestId },
    })

    if (!payment || payment.status !== 'PENDING') {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    if (callback.resultCode === 0) {
      const claimed = await prisma.$transaction(async (tx) => {
        const orderUpdate = await tx.importOrder.updateMany({
          where: { id: payment.orderId, status: 'PAYMENT_PENDING' },
          data: { status: 'PAID', errorMessage: null },
        })
        if (orderUpdate.count !== 1) return false

        const paymentUpdate = await tx.importPayment.updateMany({
          where: { id: payment.id, status: 'PENDING' },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            mpesaReceiptNumber: callback.mpesaReceiptNumber,
            ...(callback.merchantRequestId ? { merchantRequestId: callback.merchantRequestId } : {}),
          },
        })
        if (paymentUpdate.count !== 1) throw new Error('Payment state changed while processing the callback.')
        return true
      })

      if (claimed) {
        try {
          await submitPaidImportOrder(payment.orderId)
        } catch {
          // The order state is persisted as FAILED by submitPaidImportOrder.
        }
      }
    } else {
      await prisma.$transaction(async (tx) => {
        const paymentUpdate = await tx.importPayment.updateMany({
          where: { id: payment.id, status: 'PENDING' },
          data: {
            status: 'FAILED',
            ...(callback.merchantRequestId ? { merchantRequestId: callback.merchantRequestId } : {}),
          },
        })
        if (paymentUpdate.count !== 1) return

        await tx.importOrder.updateMany({
          where: { id: payment.orderId, status: 'PAYMENT_PENDING' },
          data: { status: 'FAILED', errorMessage: callback.resultDescription },
        })
      })
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (error) {
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: error instanceof Error ? error.message : 'Invalid callback.' },
      { status: 400 },
    )
  }
}
