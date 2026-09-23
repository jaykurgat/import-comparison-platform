const baseUrl = (process.env.SMOKE_BASE_URL ?? '').replace(/\/$/, '')

if (!baseUrl) {
  console.error('SMOKE_BASE_URL is required.')
  process.exit(1)
}

const checks = [
  { name: 'health', path: '/api/health', expected: [200] },
  { name: 'products', path: '/products', expected: [200] },
  { name: 'robots', path: '/robots.txt', expected: [200] },
  { name: 'sitemap', path: '/sitemap.xml', expected: [200] },
]

let failed = false

for (const check of checks) {
  try {
    const response = await fetch(new URL(check.path, baseUrl), {
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    })

    if (!check.expected.includes(response.status)) {
      failed = true
      console.error(`FAIL ${check.name}: HTTP ${response.status}`)
      continue
    }

    console.log(`PASS ${check.name}: HTTP ${response.status}`)
  } catch (error) {
    failed = true
    console.error(`FAIL ${check.name}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

try {
  const response = await fetch(new URL('/api/admin/aliexpress/sync', baseUrl), {
    method: 'POST',
    signal: AbortSignal.timeout(20_000),
  })

  if (response.status !== 401) {
    failed = true
    console.error(`FAIL protected supplier endpoint: expected HTTP 401, received ${response.status}`)
  } else {
    console.log('PASS protected supplier endpoint: HTTP 401 without secret')
  }
} catch (error) {
  failed = true
  console.error(`FAIL protected supplier endpoint: ${error instanceof Error ? error.message : String(error)}`)
}

if (failed) {
  process.exit(1)
}

console.log('Production smoke validation passed.')
