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
  const result = await syncAliExpressCatalog({
    limit: typeof body.limit === 'number' ? body.limit : 20,
    candidatesPerLocal:
      typeof body.candidatesPerLocal === 'number' ? body.candidatesPerLocal : 5,
    freightSkusPerProduct:
      typeof body.freightSkusPerProduct === 'number' ? body.freightSkusPerProduct : 1,
    shipToCountry: typeof body.shipToCountry === 'string' ? body.shipToCountry : 'KE',
    currency: typeof body.currency === 'string' ? body.currency : 'USD',
  })

  return NextResponse.json(result)
}
