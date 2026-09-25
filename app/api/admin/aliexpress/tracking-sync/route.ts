import { NextResponse } from 'next/server'
import { syncActiveImportTracking } from '@/lib/checkout/syncImportTracking'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const secret = process.env.CATALOG_SYNC_SECRET
  if (!secret || request.headers.get('x-catalog-sync-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const limit = Math.min(100, Math.max(1, Number(body.limit ?? 50)))
    const results = await syncActiveImportTracking(limit)

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
