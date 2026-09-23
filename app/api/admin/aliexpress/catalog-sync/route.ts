import { NextResponse } from 'next/server'
import { syncAliExpressCatalog } from '@/lib/aliexpress/catalogSync'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const expected = process.env.CATALOG_SYNC_SECRET
  const supplied = request.headers.get('x-catalog-sync-secret')

  if (!expected || supplied !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const clamp = (value: unknown, fallback: number, max: number) =>
    typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.min(Math.floor(value), max)) : fallback
  const result = await syncAliExpressCatalog({
    limit: clamp(body.limit, 20, 100),
    candidatesPerLocal:
      clamp(body.candidatesPerLocal, 5, 20),
    freightSkusPerProduct:
      clamp(body.freightSkusPerProduct, 1, 5),
    shipToCountry: typeof body.shipToCountry === 'string' ? body.shipToCountry : 'KE',
    currency: typeof body.currency === 'string' ? body.currency : 'USD',
  })

  return NextResponse.json(result)
}
