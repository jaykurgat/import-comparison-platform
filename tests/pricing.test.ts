import test from 'node:test'
import assert from 'node:assert/strict'
import { getMarkupForLandedCost } from '../lib/pricing/getMarkupForLandedCost'

test('markup tiers use the documented boundary values', () => {
  assert.equal(getMarkupForLandedCost(999), 200)
  assert.equal(getMarkupForLandedCost(1000), 400)
  assert.equal(getMarkupForLandedCost(1999), 400)
  assert.equal(getMarkupForLandedCost(2000), 600)
  assert.equal(getMarkupForLandedCost(14999), 1200)
  assert.equal(getMarkupForLandedCost(15000), 1725)
  assert.equal(getMarkupForLandedCost(50000), 5750)
})
