import test from 'node:test'
import assert from 'node:assert/strict'
import { isCatalogEligible } from '../lib/storefront/catalogEligibility'

test('V4 local storefront products remain eligible without enrichment data', () => {
  assert.equal(
    isCatalogEligible({
      title: 'Basic Local Product',
      description: null,
      imageUrls: [],
      currentPrice: 1500,
      currency: 'KES',
    }),
    true,
  )
})

test('local storefront eligibility rejects invalid catalog rows', () => {
  assert.equal(
    isCatalogEligible({
      title: '',
      description: 'Description',
      imageUrls: ['https://example.com/image.jpg'],
      currentPrice: 1500,
      currency: 'KES',
    }),
    false,
  )

  assert.equal(
    isCatalogEligible({
      title: 'Free Sample',
      description: null,
      imageUrls: [],
      currentPrice: 0,
      currency: 'KES',
    }),
    false,
  )
})

test('local storefront eligibility does not require a match or comparison', () => {
  assert.equal(
    isCatalogEligible({
      title: 'Unmatched Local Product',
      description: null,
      imageUrls: [],
      currentPrice: 899,
      currency: 'KES',
    }),
    true,
  )
})
