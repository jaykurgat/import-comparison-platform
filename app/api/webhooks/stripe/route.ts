import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { submitPaidImportOrder } from '@/lib/checkout/submitPaidImportOrder'

export const runtime = 'nodejs'

interface StripeEvent {
  type: string
  data?: { object?: {
    id?: string
    payment_status?: string
    payment_intent?: string | null
    metadata?: { order_id?: string }
  } }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 500 })

  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature || !verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 })
  }

  let event: StripeEvent
  try {
    event = JSON.parse(payload) as StripeEvent
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 })
  }

  const session = event.data?.object
  const orderId = session?.metadata?.order_id

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    if (orderId && session?.payment_status === 'paid') {
      await markPaidAndSubmit(orderId, session.id, session.payment_intent)
    }
  }

  if (event.type === 'checkout.session.expired' && orderId) {
    await prisma.importOrder.updateMany({
      where: { id: orderId, status: 'PAYMENT_PENDING' },
      data: { status: 'CANCELLED', errorMessage: 'Payment checkout expired.' },
    })
    await prisma.importPayment.updateMany({
      where: { checkoutSessionId: session?.id ?? '', status: 'PENDING' },
      data: { status: 'EXPIRED' },
    })
  }

  return NextResponse.json({ received: true })
}

async function markPaidAndSubmit(orderId: string, sessionId?: string, paymentIntentId?: string | null) {
  const payment = await prisma.importPayment.findUnique({ where: { orderId } })
  if (!payment || (sessionId && payment.checkoutSessionId !== sessionId)) return

  await prisma.$transaction([
    prisma.importPayment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        ...(paymentIntentId ? { paymentIntentId } : {}),
      },
    }),
    prisma.importOrder.updateMany({
      where: { id: orderId, status: 'PAYMENT_PENDING' },
      data: { status: 'PAID' },
    }),
  ])

  await submitPaidImportOrder(orderId)
}

function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  const parts = new Map<string, string[]>()
  for (const item of header.split(',')) {
    const [key, value] = item.split('=', 2)
    if (!key || !value) continue
    const existing = parts.get(key) ?? []
    existing.push(value)
    parts.set(key, existing)
  }

  const timestamp = parts.get('t')?.[0]
  const signatures = parts.get('v1') ?? []
  if (!timestamp || !signatures.length) return false

  const timestampNumber = Number(timestamp)
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false

  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'utf8')

  return signatures.some((signature) => {
    const received = Buffer.from(signature, 'utf8')
    return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer)
  })
}
