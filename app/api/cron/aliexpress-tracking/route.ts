import { NextResponse } from 'next/server'
import { syncActiveImportTracking } from '@/lib/checkout/syncImportTracking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== 'Bearer ' + secret) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const results = await syncActiveImportTracking(50)
    return NextResponse.json({
      ok: true,
      ordersChecked: results.length,
      shipmentsUpdated: results.reduce((sum, item) => sum + item.shipmentsUpdated, 0),
      eventsAdded: results.reduce((sum, item) => sum + item.eventsAdded, 0),
      errors: results.flatMap((item) => item.errors).slice(0, 50),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Tracking sync failed.' },
      { status: 500 },
    )
  }
}
