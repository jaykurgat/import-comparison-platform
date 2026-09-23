import test from 'node:test'
import assert from 'node:assert/strict'
import { canPublishSupplierSku } from '../lib/admin/catalogPublishability'

test('supplier SKU is publishable only with stock and current sell price', () => {
  assert.equal(canPublishSupplierSku({ stock: 4, hasSellPrice: true, priceIsStale: false, hasTitle: true, hasImage: true }), true)
  assert.equal(canPublishSupplierSku({ stock: 0, hasSellPrice: true, priceIsStale: false, hasTitle: true, hasImage: true }), false)
  assert.equal(canPublishSupplierSku({ stock: 4, hasSellPrice: false, priceIsStale: false, hasTitle: true, hasImage: true }), false)
  assert.equal(canPublishSupplierSku({ stock: 4, hasSellPrice: true, priceIsStale: true, hasTitle: true, hasImage: true }), false)
})


test('supplier SKU is not publishable without complete merchandising data', () => {
  assert.equal(canPublishSupplierSku({ stock: 4, hasSellPrice: true, priceIsStale: false, hasTitle: false, hasImage: true }), false)
  assert.equal(canPublishSupplierSku({ stock: 4, hasSellPrice: true, priceIsStale: false, hasTitle: true, hasImage: false }), false)
})
