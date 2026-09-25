import { createHmac, timingSafeEqual } from 'node:crypto'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'

interface PaystackChargeResponse {
  status: boolean
  message: string
  data?: {
    reference: string
    status: string
    display_text?: string
    id?: number
  }
}

interface PaystackVerifyResponse {
  status: boolean
  message: string
  data?: {
    id: number
    status: string
    reference: string
    amount: number
    currency: string
    receipt_number?: string | null
    gateway_response?: string | null
    paid_at?: string | null
    channel?: string | null
  }
}

export async function createPaystackMpesaCharge(input: {
  amountKes: number
  email: string
  phoneNumber: string
  reference: string
}) {
  const amount = Math.max(1, Math.round(input.amountKes * 100))
  const phone = normalizeKenyanPhone(input.phoneNumber)

  const response = await fetch(`${PAYSTACK_BASE_URL}/charge`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      email: input.email,
      currency: 'KES',
      reference: input.reference,
      mobile_money: {
        phone,
        provider: 'mpesa',
      },
    }),
    cache: 'no-store',
  })

  const body = await response.json() as PaystackChargeResponse
  if (!response.ok || !body.status || !body.data?.reference) {
    throw new Error(body.message || 'Paystack payment could not be started.')
  }

  return {
    reference: body.data.reference,
    status: body.data.status,
    customerMessage: body.data.display_text ?? 'Check your phone and complete the M-PESA payment.',
    transactionId: body.data.id ?? null,
  }
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${getSecretKey()}` },
      cache: 'no-store',
    },
  )

  const body = await response.json() as PaystackVerifyResponse
  if (!response.ok || !body.status || !body.data) {
    throw new Error(body.message || 'Unable to verify the Paystack transaction.')
  }

  return body.data
}

export function verifyPaystackSignature(payload: string, signature: string | null): boolean {
  const signatureKey = getSecretKey()
  if (!signature) return false

  const expected = createHmac('sha512', signatureKey).update(payload).digest('hex')
  const provided = Buffer.from(signature, 'utf8')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  return provided.length === expectedBuffer.length && timingSafeEqual(provided, expectedBuffer)
}

function getSecretKey(): string {
  const value = process.env.PAYSTACK_SECRET_KEY
  if (!value) throw new Error('PAYSTACK_SECRET_KEY is not configured.')
  return value
}

function normalizeKenyanPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length === 12) return `+${digits}`
  if (digits.startsWith('07') && digits.length === 10) return `+254${digits.slice(1)}`
  if (digits.startsWith('01') && digits.length === 10) return `+254${digits.slice(1)}`
  throw new Error('Enter a valid Kenyan mobile number.')
}
