import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyCategory } from '../lib/categories/taxonomy'

test('classifies a product into the controlled canonical taxonomy from title evidence', () => {
  const result = classifyCategory({ title: '500ml Stainless Steel Water Bottle Tumbler' })
  assert.deepEqual(result?.path, ['Home & Kitchen', 'Drinkware'])
})

test('uses an explicit source category as stronger evidence', () => {
  const result = classifyCategory({
    title: 'Portable laptop stand',
    sourceCategoryName: 'Computer Accessories',
  })
  assert.deepEqual(result?.path, ['Electronics', 'Computer Accessories'])
})

test('leaves ambiguous products uncategorized instead of guessing', () => {
  const result = classifyCategory({ title: 'Premium accessory' })
  assert.equal(result, null)
})

test('does not use a generic word alone to classify drinkware', () => {
  const result = classifyCategory({ title: 'Tempered glass screen protector for phone' })
  assert.deepEqual(result?.path, ['Electronics', 'Mobile Accessories'])
})
