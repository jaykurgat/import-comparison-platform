import 'dotenv/config'
import { generateSignature } from '../lib/aliexpress/sign'

/**
 * Step 2 of the test flow. Takes the `code` you copied from the browser
 * address bar and exchanges it for an access_token + refresh_token.
 *
 * This endpoint is REST-style per the documentation summary, so it uses:
 *   - the API path prepended to the signed string ('/auth/token/create')
 *   - timestamp as Unix epoch MILLISECONDS (e.g. "1711234567890"), NOT the
 *     "YYYY-MM-DD HH:MM:SS" format used by the classic /sync method calls
 *     in aliexpress-test-product.ts. Confirmed by testing: the string-date
 *     format caused an "IllegalTimestamp" error on this specific endpoint.
 */

const APP_KEY = process.env.ALIEXPRESS_APP_KEY
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET
const TOKEN_ENDPOINT = 'https://api-sg.aliexpress.com/rest/auth/token/create'
const API_PATH = '/auth/token/create'

async function main() {
  const code = process.argv[2]

  if (!code) {
    console.error('Usage: npx tsx scripts/aliexpress-exchange-token.ts <code>')
    process.exit(1)
  }
  if (!APP_KEY || !APP_SECRET) {
    console.error('Missing ALIEXPRESS_APP_KEY or ALIEXPRESS_APP_SECRET in .env')
    process.exit(1)
  }

  const params: Record<string, string> = {
    app_key: APP_KEY,
    code,
    sign_method: 'hmac-sha256',
    timestamp: Date.now().toString(),
  }

  const sign = generateSignature(API_PATH, params, APP_SECRET, 'hmac-sha256')
  const body = new URLSearchParams({ ...params, sign })

  console.log('Sending token exchange request...')
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const text = await res.text()
  console.log(`\nHTTP status: ${res.status}`)
  console.log('\nRaw response:\n')
  console.log(text)

  try {
    const json = JSON.parse(text)
    if (json.access_token) {
      console.log('\n✅ Success — add these to your .env:')
      console.log(`ALIEXPRESS_ACCESS_TOKEN="${json.access_token}"`)
      if (json.refresh_token) {
        console.log(`ALIEXPRESS_REFRESH_TOKEN="${json.refresh_token}"`)
      }
    } else {
      console.log('\n⚠️  No access_token in the response — see the raw response above for the error.')
    }
  } catch {
    console.log('\n⚠️  Response was not valid JSON — see the raw response above.')
  }
}

main().catch((err) => {
  console.error('Request failed:', err)
  process.exit(1)
})
