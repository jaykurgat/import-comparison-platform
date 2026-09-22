import { NextResponse } from 'next/server'
import { syncAliExpressCatalog } from '@/lib/aliexpress/catalogSync'

export const runtime = 'nodejs'

/**
 * Internal catalog hydration endpoint.
 *
 * This route is deliberately protected separately from the existing review
 * UI because it can make many upstream API calls. It discovers supplier
 * candidates from current local products, persists exact SKUs, and fetches a
 * representative Kenya freight quote. It never publishes an AliExpress SKU.
 */
export async function POST(request: Request) {
  const expectedSecret = process.env.CATALOG_SYNC_SECRET
  const suppliedSecret = request.headers.get('x-catalog-sync-secret')

  if (!expectedSecret || suppliedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    limit?: number
    candidatesPerLocal?: number
    freightSkusPerProduct?: number
    shipToCountry?: string
    currency?: string
  } = {}

  try {
    body = await request.json()
  } catch {
    // Empty body is valid; defaults are used.
  }

  const result = await syncAliExpressCatalog(body)
  return NextResponse.json(result)
}
