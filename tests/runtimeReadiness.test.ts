import test from 'node:test'
import assert from 'node:assert/strict'
import { getRuntimeReadiness } from '../lib/config/runtime'

test('runtime readiness requires the core production variables', () => {
  const original = { ...process.env }

  for (const key of ['DATABASE_URL', 'ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET', 'CATALOG_SYNC_SECRET']) {
    delete process.env[key]
  }

  const result = getRuntimeReadiness()

  assert.equal(result.ready, false)
  assert.deepEqual(result.missing, [
    'DATABASE_URL',
    'ADMIN_PASSWORD',
    'ADMIN_SESSION_SECRET',
    'CATALOG_SYNC_SECRET',
  ])

  process.env = original
})

test('runtime readiness does not require supplier or Daraja credentials for storefront startup', () => {
  const original = { ...process.env }

  process.env.DATABASE_URL = 'postgres://example'
  process.env.ADMIN_PASSWORD = 'password'
  process.env.ADMIN_SESSION_SECRET = 'secret'
  process.env.CATALOG_SYNC_SECRET = 'catalog-secret'
  delete process.env.DARAJA_ENVIRONMENT

  const result = getRuntimeReadiness()

  assert.equal(result.ready, true)
  assert.match(result.warnings.join('\n'), /Supplier integrations are not fully configured/)
  assert.doesNotMatch(result.warnings.join('\n'), /Daraja is not enabled for production payments/)

  process.env = original
})
