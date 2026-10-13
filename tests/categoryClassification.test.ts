import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyCategory, normalizeCategoryText } from '../lib/categories/taxonomy'

test('normalizes category labels consistently for matching and deduplication', () => {
  assert.equal(normalizeCategoryText('Women’s Clothing & Apparel'), 'womens clothing and apparel')
})

test('does not invent a canonical category from a product title', () => {
  assert.equal(classifyCategory({ title: '500ml Stainless Steel Water Bottle Tumbler' }), null)
})

test('does not map a source leaf label to a fabricated hard-coded parent', () => {
  assert.equal(classifyCategory({
    title: 'Portable laptop stand',
    sourceCategoryName: 'Computer Accessories',
  }), null)
})

test('leaves ambiguous products unclassified until supplier metadata or admin mapping exists', () => {
  assert.equal(classifyCategory({ title: 'Premium accessory' }), null)
})
