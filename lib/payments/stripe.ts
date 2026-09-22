const STRIPE_API = 'https://api.stripe.com/v1'

interface StripeCheckoutSession {
  id: string
  url: string | null
  payment_status?: string
  payment_intent?: string | null
}

export async function createStripeCheckoutSession(input: {
  orderId: string
  amountKes: number
  productName: string
  quantity: number
}): Promise<StripeCheckoutSession> {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) throw new Error('Stripe payments are not configured.')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL is not configured.')

  if (!Number.isInteger(input.amountKes) || input.amountKes < 100) {
    throw new Error('Checkout amount must be at least KES 100.')
  }

  const body = new URLSearchParams()
  body.set('mode', 'payment')
  body.set('success_url', `${appUrl}/checkout/import/success?order_id=${encodeURIComponent(input.orderId)}`)
  body.set('cancel_url', `${appUrl}/checkout/import/cancel?order_id=${encodeURIComponent(input.orderId)}`)
  body.set('client_reference_id', input.orderId)
  body.set('line_items[0][price_data][currency]', 'kes')
  body.set('line_items[0][price_data][product_data][name]', input.productName.slice(0, 250))
  body.set('line_items[0][price_data][unit_amount]', String(input.amountKes * 100))
  body.set('line_items[0][quantity]', '1')
  body.set('metadata[order_id]', input.orderId)
  body.set('payment_intent_data[metadata][order_id]', input.orderId)

  const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  })

  const data = await response.json() as StripeCheckoutSession & { error?: { message?: string } }
  if (!response.ok || !data.id || !data.url) {
    throw new Error(data.error?.message ?? 'Unable to create Stripe Checkout Session.')
  }

  return data
}
