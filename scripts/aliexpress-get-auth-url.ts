import 'dotenv/config'

/**
 * Step 1 of the test flow. This app's registered callback URL doesn't have
 * anything live behind it yet — that's fine for this test. After you
 * authorize, your browser will try to redirect there and likely show a
 * "can't reach this page" error. That's expected. What matters is the
 * browser's ADDRESS BAR at that point — it will contain "?code=XXXXX".
 * Copy that code and pass it to aliexpress-exchange-token.ts next.
 */

const APP_KEY = process.env.ALIEXPRESS_APP_KEY
const CALLBACK_URL =
  process.env.ALIEXPRESS_CALLBACK_URL ?? 'https://landedcompare.vercel.app/api/aliexpress/callback'

if (!APP_KEY) {
  console.error('Missing ALIEXPRESS_APP_KEY in .env')
  process.exit(1)
}

const url = new URL('https://api-sg.aliexpress.com/oauth/authorize')
url.searchParams.set('response_type', 'code')
url.searchParams.set('force_auth', 'true')
url.searchParams.set('redirect_uri', CALLBACK_URL)
url.searchParams.set('client_id', APP_KEY)

console.log('\nOpen this URL in your browser and log in / authorize with your AliExpress account:\n')
console.log(url.toString())
console.log(
  '\nAfter authorizing, the page will likely fail to load (expected — nothing is deployed at the callback yet).'
)
console.log('Look at the browser ADDRESS BAR — it will contain "?code=XXXXX".')
console.log('Copy just that code value, then run:')
console.log('  npx tsx scripts/aliexpress-exchange-token.ts <code>\n')
