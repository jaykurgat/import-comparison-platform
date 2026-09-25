import { NextResponse } from 'next/server'
import { verifyOrderAccessToken } from '@/lib/checkout/orderAccess'
import { syncImportOrderTracking } from '@/lib/checkout/syncImportTracking'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const orderId = String(body.orderId ?? '').trim()
    const token = body.token ? String(body.token) : null

    if (!orderId || !verifyOrderAccessToken(orderId, token)) {
      return NextResponse.json({ error: 'Invalid order access token.' }, { status: 403 })
    }

    const result = await syncImportOrderTracking(orderId)
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Tracking refresh failed.' },
      { status: 400 },
    )
  }
}
