import test from 'node:test'
import assert from 'node:assert/strict'
import { canPublishSupplierSku } from '../lib/admin/catalogPublishability'

test('supplier SKU is publishable only with stock and current sell price', () => {
  assert.equal(canPublishSupplierSku({ stock: 4, hasSellPrice: true, priceIsStale: false }), true)
  assert.equal(canPublishSupplierSku({ stock: 0, hasSellPrice: true, priceIsStale: false }), false)
  assert.equal(canPublishSupplierSku({ stock: 4, hasSellPrice: false, priceIsStale: false }), false)
  assert.equal(canPublishSupplierSku({ stock: 4, hasSellPrice: true, priceIsStale: true }), false)
})
