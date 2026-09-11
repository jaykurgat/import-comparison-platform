import crypto from 'crypto'

export type SignMethod = 'md5' | 'hmac-sha256'

/**
 * Formats the current time as the AliExpress/TOP protocol expects:
 * "YYYY-MM-DD HH:MM:SS" in the Asia/Shanghai (UTC+8) timezone — regardless
 * of what timezone the machine running this code is actually in. Getting
 * this wrong causes an "Invalid Timestamp" error even with a correct sign.
 */
export function getTopTimestamp(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`
}

/**
 * Computes the AliExpress/TOP protocol request signature.
 *
 * ⚠️ THIS IS THE THING UNDER TEST. It's built from a third-party (Gemini)
 * summary of AliExpress's docs, which I have no way to verify independently
 * (no browsing access here). One specific detail is genuinely ambiguous:
 * whether `apiPath` should be prepended to the string before hashing for
 * classic method-based calls (like `/sync`). The summary's own written
 * instructions say to prepend it, but its own worked example does NOT show
 * a path in the string being signed. Because of that contradiction, the
 * calling scripts default to apiPath = '' for /sync calls — if AliExpress
 * responds with an invalid-signature error, try passing '/sync' instead as
 * the very first thing to change.
 */
export function generateSignature(
  apiPath: string,
  params: Record<string, string>,
  appSecret: string,
  signMethod: SignMethod = 'hmac-sha256'
): string {
  const sortedKeys = Object.keys(params).sort()
  const concatenated = sortedKeys.map((key) => `${key}${params[key]}`).join('')
  const stringToSign = apiPath + concatenated

  if (signMethod === 'md5') {
    const wrapped = appSecret + stringToSign + appSecret
    return crypto.createHash('md5').update(wrapped, 'utf8').digest('hex').toUpperCase()
  }

  return crypto
    .createHmac('sha256', appSecret)
    .update(stringToSign, 'utf8')
    .digest('hex')
    .toUpperCase()
}
