import { prisma } from '@/lib/prisma'
import { parseDarajaCallback } from './daraja'
import { submitPaidImportOrder } from '@/lib/checkout/submitPaidImportOrder'

export async function processDarajaCallback(payload: unknown): Promise<void> {
  const callback = parseDarajaCallback(payload as Parameters<typeof parseDarajaCallback>[0])

  const payment = await prisma.importPayment.findUnique({
    where: { checkoutRequestId: callback.checkoutRequestId },
  })

  if (!payment || payment.status === 'PAID') return

  if (callback.resultCode !== 0) {
    await prisma.$transaction([
      prisma.importPayment.updateMany({
        where: { id: payment.id, status: 'PENDING' },
        data: {
          status: 'FAILED',
          ...(callback.merchantRequestId ? { merchantRequestId: callback.merchantRequestId } : {}),
        },
      }),
      prisma.importOrder.updateMany({
        where: { id: payment.orderId, status: 'PAYMENT_PENDING' },
        data: { status: 'FAILED', errorMessage: callback.resultDescription },
      }),
    ])
    return
  }

  if (callback.amount === null || Math.round(callback.amount) !== Math.round(Number(payment.amount))) {
    await prisma.$transaction([
      prisma.importPayment.updateMany({
        where: { id: payment.id, status: 'PENDING' },
        data: {
          status: 'FAILED',
          ...(callback.merchantRequestId ? { merchantRequestId: callback.merchantRequestId } : {}),
        },
      }),
      prisma.importOrder.updateMany({
        where: { id: payment.orderId, status: 'PAYMENT_PENDING' },
        data: {
          status: 'FAILED',
          errorMessage: 'The confirmed M-PESA amount did not match the checkout amount.',
        },
      }),
    ])
    return
  }

  const claimed = await prisma.$transaction(async (tx) => {
    const paymentUpdate = await tx.importPayment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        mpesaReceiptNumber: callback.mpesaReceiptNumber,
        ...(callback.merchantRequestId ? { merchantRequestId: callback.merchantRequestId } : {}),
      },
    })

    if (paymentUpdate.count !== 1) return false

    const orderUpdate = await tx.importOrder.updateMany({
      where: { id: payment.orderId, status: 'PAYMENT_PENDING' },
      data: { status: 'PAID', errorMessage: null },
    })

    return orderUpdate.count === 1
  })

  if (!claimed) return

  try {
    await submitPaidImportOrder(payment.orderId)
  } catch {
    // Payment remains durably recorded as PAID; supplier failure is persisted
    // on the order for administrative follow-up.
  }
}
