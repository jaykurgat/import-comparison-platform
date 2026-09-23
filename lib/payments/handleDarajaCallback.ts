import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDarajaCallback, queryDarajaStkPush } from '@/lib/payments/daraja'
import { submitPaidImportOrder } from '@/lib/checkout/submitPaidImportOrder'

export async function handleDarajaCallback(request: Request): Promise<NextResponse> {
  let callback
  try {
    callback = parseDarajaCallback(await request.json())
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid Daraja callback.' }, { status: 400 })
  }

  const payment = await prisma.importPayment.findUnique({
    where: { checkoutRequestId: callback.checkoutRequestId },
    include: { order: true },
  })

  if (!payment) {
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: 'Payment intent is not registered yet.' },
      { status: 503 },
    )
  }
  if (payment.status !== 'PENDING') {
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Already processed.' })
  }
  if (payment.merchantRequestId && callback.merchantRequestId !== payment.merchantRequestId) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Merchant request does not match.' }, { status: 409 })
  }

  let confirmation
  try {
    confirmation = await queryDarajaStkPush(callback.checkoutRequestId)
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Unable to verify payment with Daraja.' }, { status: 503 })
  }

  if (confirmation.resultCode === null) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Daraja has not returned a final payment result.' }, { status: 503 })
  }

  if (confirmation.resultCode === '0') {
    const callbackPhone = normalizePhone(callback.phoneNumber)
    const orderPhone = normalizePhone(payment.order.mobileNo)
    if (
      callback.resultCode !== 0 ||
      callback.amount === null ||
      callback.amount !== Number(payment.amount) ||
      !callback.mpesaReceiptNumber ||
      !callbackPhone ||
      callbackPhone !== orderPhone
    ) {
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: 'Payment details do not match the order.' },
        { status: 409 },
      )
    }

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
        data: { status: 'FAILED', errorMessage: confirmation.resultDescription },
      })
    })
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
}

function normalizePhone(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, '') ?? ''
  if (digits.startsWith('254') && digits.length === 12) return digits
  if ((digits.startsWith('07') || digits.startsWith('01')) && digits.length === 10) {
    return `254${digits.slice(1)}`
  }
  return null
}
