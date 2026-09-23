import { createHmac, timingSafeEqual } from 'node:crypto'

function getSecret(): string {
  const value = process.env.IMPORT_ORDER_ACCESS_SECRET
  if (!value) throw new Error('IMPORT_ORDER_ACCESS_SECRET is not configured.')
  return value
}

export function createOrderAccessToken(orderId: string): string {
  return createHmac('sha256', getSecret()).update(orderId).digest('hex')
}

export function verifyOrderAccessToken(orderId: string, token: string | null): boolean {
  if (!token) return false
  const expected = createOrderAccessToken(orderId)
  const actual = Buffer.from(token, 'utf8')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer)
}
