import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRuntimeReadiness } from '@/lib/config/runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const startedAt = Date.now()
  const readiness = getRuntimeReadiness()

  try {
    await prisma.$queryRaw`SELECT 1`

    const status = readiness.ready ? 'ok' : 'degraded'
    return NextResponse.json(
      {
        status,
        database: 'ok',
        configuration: readiness.ready ? 'ok' : 'incomplete',
        configuration: readiness.ready ? 'ok' : 'incomplete',
        warnings: readiness.warnings.length,
        uptimeMs: Date.now() - startedAt,
      },
      { status: readiness.ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'unavailable',
        configuration: readiness.ready ? 'ok' : 'incomplete',
        missingRequiredConfig: readiness.missing,
        warnings: readiness.warnings,
        uptimeMs: Date.now() - startedAt,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
