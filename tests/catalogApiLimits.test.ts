import test from 'node:test'
import assert from 'node:assert/strict'

function clamp(value: unknown, fallback: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.min(Math.floor(value), max)) : fallback
}

test('catalog sync limits are bounded', () => {
  assert.equal(clamp(1000, 20, 100), 100)
  assert.equal(clamp(0, 20, 100), 1)
  assert.equal(clamp(4.9, 20, 100), 4)
  assert.equal(clamp('100', 20, 100), 20)
})
