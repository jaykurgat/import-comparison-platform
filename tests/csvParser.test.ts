import test from 'node:test'
import assert from 'node:assert/strict'
import { parseCsv } from '../lib/ingestion/csvParser'

test('CSV parser accepts valid rows and maps optional fields', () => {
  const result = parseCsv(
    'Product,Price,URL,Images,Stock,Color,Size\nWidget,1,https://example.com/p,a.jpg;b.jpg,yes,Black,M',
    { title: 'Product', price: 'Price', sourceUrl: 'URL', imageUrls: 'Images', inStock: 'Stock', color: 'Color', size: 'Size' },
  )
  assert.equal(result.errors.length, 0)
  assert.equal(result.rows.length, 1)
  assert.equal(result.rows[0].sourceUrl, 'https://example.com/p')
  assert.deepEqual(result.rows[0].imageUrls, ['a.jpg', 'b.jpg'])
  assert.equal(result.rows[0].inStock, true)
  assert.deepEqual(result.rows[0].attributesRaw, { color: 'Black', size: 'M' })
})

test('CSV parser rejects missing title and invalid price without guessing', () => {
  const result = parseCsv('Product,Price\n,1200\nValid,not-a-price', { title: 'Product', price: 'Price' })
  assert.equal(result.rows.length, 0)
  assert.equal(result.errors.length, 2)
  assert.match(result.errors[0].reason, /Missing required title/)
  assert.match(result.errors[1].reason, /Missing or unparseable price/)
})

test('CSV parser defaults currency to KES and sourceRef to row number', () => {
  const result = parseCsv('Product,Price\nWidget,1200', { title: 'Product', price: 'Price' })
  assert.equal(result.rows[0].currency, 'KES')
  assert.equal(result.rows[0].sourceRef, 'csv-row-2')
})
