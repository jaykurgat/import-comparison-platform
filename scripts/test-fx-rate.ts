/**
 * Disposable test script — same discipline as the AliExpress/Jumia tests.
 * I have no live access to verify open.er-api.com's current response shape,
 * so this just prints the raw response for us to confirm against reality
 * before building any permanent wrapper.
 *
 * No API key required for this one (that's the whole appeal), so no .env
 * setup needed to run this.
 */

const FX_API_URL = 'https://open.er-api.com/v6/latest/USD'

async function main() {
  console.log(`Calling ${FX_API_URL} ...`)
  const res = await fetch(FX_API_URL)
  const text = await res.text()

  console.log(`\nHTTP status: ${res.status}`)
  console.log('\nRaw response:\n')
  console.log(text)

  try {
    const json = JSON.parse(text)
    console.log('\n--- Extracted ---')
    console.log('result:', json.result)
    console.log('base_code:', json.base_code)
    console.log('KES rate:', json.rates?.KES)
    console.log('time_last_update_utc:', json.time_last_update_utc)
    console.log('time_next_update_utc:', json.time_next_update_utc)
  } catch {
    console.log('\n⚠️  Response was not valid JSON — see raw response above.')
  }
}

main().catch((err) => {
  console.error('Request failed:', err)
  process.exit(1)
})
