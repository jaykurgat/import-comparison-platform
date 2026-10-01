import { NextResponse } from 'next/server'
import { getCouponQuote } from '@/lib/checkout/coupons'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { code?: string; items?: Array<{ kind: 'local' | 'supplier'; productId?: string; skuId?: string; sku?: string; quantity: number }> }
    if (!String(body.code ?? '').trim()) throw new Error('Enter a coupon code.')
    return NextResponse.json(await getCouponQuote(String(body.code), body.items ?? []))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to validate coupon.' }, { status: 400 })
  }
}