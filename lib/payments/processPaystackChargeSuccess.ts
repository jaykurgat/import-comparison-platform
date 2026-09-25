import { prisma } from '@/lib/prisma'
import { submitPaidImportOrder } from '@/lib/checkout/submitPaidImportOrder'
import { verifyPaystackTransaction } from './paystack'

export async function processPaystackChargeSuccess(reference: string): Promise<void> {
  const payment = await prisma.importPayment.findUnique({
    where: { providerReference: reference },
  })
  if (!payment || payment.provider !== 'PAYSTACK' || payment.status === 'PAID') return

  const transaction = await verifyPaystackTransaction(reference)

  if (
    transaction.status !== 'success' ||
    Math.round(transaction.amount) !== Math.round(Number(payment.amount) * 100) ||
    transaction.currency !== payment.currency
  ) {
    return
  }

  const claimed = await prisma.$transaction(async (tx) => {
    const paymentUpdate = await tx.importPayment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: {
        status: 'PAID',
        paidAt: transaction.paid_at ? new Date(transaction.paid_at) : new Date(),
        merchantRequestId: transaction.id ? String(transaction.id) : null,
        mpesaReceiptNumber: transaction.receipt_number ?? null,
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
