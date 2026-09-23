import test from 'node:test'
import assert from 'node:assert/strict'
import { canPublishSupplierSku } from '../lib/admin/catalogPublishability'

test('supplier SKU is publishable with current sell price and complete merchandising data regardless of supplier stock', () => {
  assert.equal(canPublishSupplierSku({ hasSellPrice: true, priceIsStale: false, hasTitle: true, hasImage: true }), true)
  assert.equal(canPublishSupplierSku({ hasSellPrice: false, priceIsStale: false, hasTitle: true, hasImage: true }), false)
  assert.equal(canPublishSupplierSku({ hasSellPrice: true, priceIsStale: true, hasTitle: true, hasImage: true }), false)
})

test('supplier SKU is not publishable without complete merchandising data', () => {
  assert.equal(canPublishSupplierSku({ hasSellPrice: true, priceIsStale: false, hasTitle: false, hasImage: true }), false)
  assert.equal(canPublishSupplierSku({ hasSellPrice: true, priceIsStale: false, hasTitle: true, hasImage: false }), false)
})
