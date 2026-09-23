import { NextResponse } from 'next/server'
import { processDarajaCallback } from '@/lib/payments/processDarajaCallback'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    await processDarajaCallback(await request.json())
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (error) {
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: error instanceof Error ? error.message : 'Invalid callback.' },
      { status: 400 },
    )
  }
}
