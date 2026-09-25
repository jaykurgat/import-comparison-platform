import { NextResponse } from 'next/server'
import { processPaystackChargeSuccess } from '@/lib/payments/processPaystackChargeSuccess'
import { verifyPaystackSignature } from '@/lib/payments/paystack'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('x-paystack-signature')

  try {
    if (!verifyPaystackSignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid Paystack signature.' }, { status: 401 })
    }

    const body = JSON.parse(payload) as {
      event?: string
      data?: { reference?: string }
    }

    if (body.event === 'charge.success' && body.data?.reference) {
      await processPaystackChargeSuccess(body.data.reference)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed.' },
      { status: 400 },
    )
  }
}
