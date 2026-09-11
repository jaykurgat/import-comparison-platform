import 'dotenv/config'
import { generateSignature, getTopTimestamp } from '../lib/aliexpress/sign'

/**
 * Step 4 of the test flow — freight query.
 *
 * CORRECTED: the actual method is `aliexpress.ds.freight.query`, not
 * `.calculate` — confirmed directly from AliExpress's own documentation
 * after `.calculate` failed with "InvalidApiPath". Both AI-generated
 * summaries we'd used before this were wrong on this specific name; only
 * the real docs resolved it.
 *
 * Also different from what we assumed: this method takes ONE parameter,
 * `queryDeliveryReq`, whose value is a JSON-encoded STRING (not several
 * flat fields) containing quantity, shipToCountry, productId,
 * selectedSkuId, language, locale, currency, and optionally
 * provinceCode/cityCode.
 */

const APP_KEY = process.env.ALIEXPRESS_APP_KEY
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET
const ACCESS_TOKEN = process.env.ALIEXPRESS_ACCESS_TOKEN
const SYNC_ENDPOINT = 'https://api-sg.aliexpress.com/sync'
const API_PATH = '' // confirmed correct for /sync calls (same as product.get)
const METHOD = 'aliexpress.ds.freight.query'

async function main() {
  const productId = process.argv[2]
  const selectedSkuId = process.argv[3]
  const shipToCountry = process.argv[4] ?? 'KE'
  const quantity = process.argv[5] ?? '1'
  const currency = process.argv[6] ?? 'USD'

  if (!productId || !selectedSkuId) {
    console.error(
      'Usage: npx tsx scripts/aliexpress-test-freight.ts <product_id> <selected_sku_id> [ship_to_country] [quantity] [currency]\n' +
        'Get a real sku_id from a previous aliexpress-test-product.ts run (e.g. "12000042865223892").'
    )
    process.exit(1)
  }
  if (!APP_KEY || !APP_SECRET || !ACCESS_TOKEN) {
    console.error(
      'Missing ALIEXPRESS_APP_KEY, ALIEXPRESS_APP_SECRET, or ALIEXPRESS_ACCESS_TOKEN in .env. ' +
        'Run aliexpress-get-auth-url.ts and aliexpress-exchange-token.ts first.'
    )
    process.exit(1)
  }

  const queryDeliveryReq = JSON.stringify({
    quantity,
    shipToCountry,
    productId,
    selectedSkuId,
    language: 'en_US',
    locale: 'zh_CN', // as shown in AliExpress's own demo code — leave as-is unless testing shows otherwise
    currency,
  })

  const params: Record<string, string> = {
    method: METHOD,
    app_key: APP_KEY,
    session: ACCESS_TOKEN,
    timestamp: getTopTimestamp(),
    format: 'json',
    v: '2.0',
    sign_method: 'hmac-sha256',
    queryDeliveryReq,
  }

  const sign = generateSignature(API_PATH, params, APP_SECRET, 'hmac-sha256')
  const body = new URLSearchParams({ ...params, sign })

  console.log(`Calling ${METHOD} for product_id=${productId}, selected_sku_id=${selectedSkuId} ...`)
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
