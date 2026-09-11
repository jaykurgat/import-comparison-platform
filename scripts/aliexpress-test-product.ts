import 'dotenv/config'
import { generateSignature, getTopTimestamp } from '../lib/aliexpress/sign'

/**
 * Step 3 of the test flow — the actual thing we're trying to confirm works.
 * Calls aliexpress.ds.product.get for one real product ID and prints the
 * raw response. Get a product ID from any real AliExpress product URL,
 * e.g. aliexpress.com/item/1005001234567890.html -> product_id is
 * 1005001234567890.
 *
 * CONFIRMED WORKING: API_PATH = '' (empty) is correct for /sync calls —
 * the API returned a clean parameter-validation error, not a signature
 * error, which proves the signing mechanism itself is right.
 *
 * ship_to_country is required in practice (the docs summary listed it as
 * optional — confirmed otherwise by testing). Defaults to Kenya ("KE").
 */

const APP_KEY = process.env.ALIEXPRESS_APP_KEY
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET
const ACCESS_TOKEN = process.env.ALIEXPRESS_ACCESS_TOKEN
const SYNC_ENDPOINT = 'https://api-sg.aliexpress.com/sync'
const API_PATH = '' // confirmed correct — do not add '/sync' here
const METHOD = 'aliexpress.ds.product.get'

async function main() {
  const productId = process.argv[2]
  const shipToCountry = process.argv[3] ?? 'KE'

  if (!productId) {
    console.error('Usage: npx tsx scripts/aliexpress-test-product.ts <product_id> [ship_to_country]')
    process.exit(1)
  }
  if (!APP_KEY || !APP_SECRET || !ACCESS_TOKEN) {
    console.error(
      'Missing ALIEXPRESS_APP_KEY, ALIEXPRESS_APP_SECRET, or ALIEXPRESS_ACCESS_TOKEN in .env. ' +
        'Run aliexpress-get-auth-url.ts and aliexpress-exchange-token.ts first.'
    )
    process.exit(1)
  }

  const params: Record<string, string> = {
    method: METHOD,
    app_key: APP_KEY,
    session: ACCESS_TOKEN,
    timestamp: getTopTimestamp(),
    format: 'json',
    v: '2.0',
    sign_method: 'hmac-sha256',
    product_id: productId,
    ship_to_country: shipToCountry,
  }

  const sign = generateSignature(API_PATH, params, APP_SECRET, 'hmac-sha256')
  const body = new URLSearchParams({ ...params, sign })

  console.log(`Calling ${METHOD} for product_id=${productId}, ship_to_country=${shipToCountry} ...`)
  const res = await fetch(SYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const text = await res.text()
  console.log(`\nHTTP status: ${res.status}`)
  console.log('\nRaw response:\n')
  console.log(text)
}

main().catch((err) => {
  console.error('Request failed:', err)
  process.exit(1)
})
