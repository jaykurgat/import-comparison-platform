import { handleDarajaCallback } from '@/lib/payments/handleDarajaCallback'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleDarajaCallback(request)
}
