import { NextResponse } from 'next/server'
import { repriceImportCatalog } from '@/lib/pricing/repriceImportCatalog'

export const runtime = 'nodejs'

/**
 * Reprices already-hydrated AliExpress SKUs from durable product/freight
 * snapshots. This route never discovers products and never publishes them.
 */
export async function POST(request: Request) {
  const expectedSecret = process.env.CATALOG_SYNC_SECRET
  const suppliedSecret = request.headers.get('x-catalog-sync-secret')

  if (!expectedSecret || suppliedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { limit?: number; publishedOnly?: boolean } = {}

  try {
    body = await request.json()
  } catch {
    // Empty body is valid; defaults are used.
  }

  const result = await repriceImportCatalog(body)
  return NextResponse.json(result)
}
