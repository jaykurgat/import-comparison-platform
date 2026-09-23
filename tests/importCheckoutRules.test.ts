import test from 'node:test'
import assert from 'node:assert/strict'

function canStartImportCheckout(input: {
  published: boolean
  stock: number
  hasPrice: boolean
  priceIsStale: boolean
  quantity: number
}): boolean {
  return input.published && input.stock >= input.quantity && input.hasPrice && !input.priceIsStale
}

test('checkout requires published, stocked, current-priced import listing', () => {
  assert.equal(canStartImportCheckout({ published: true, stock: 5, hasPrice: true, priceIsStale: false, quantity: 2 }), true)
  assert.equal(canStartImportCheckout({ published: false, stock: 5, hasPrice: true, priceIsStale: false, quantity: 1 }), false)
  assert.equal(canStartImportCheckout({ published: true, stock: 0, hasPrice: true, priceIsStale: false, quantity: 1 }), false)
  assert.equal(canStartImportCheckout({ published: true, stock: 5, hasPrice: false, priceIsStale: false, quantity: 1 }), false)
  assert.equal(canStartImportCheckout({ published: true, stock: 5, hasPrice: true, priceIsStale: true, quantity: 1 }), false)
  assert.equal(canStartImportCheckout({ published: true, stock: 1, hasPrice: true, priceIsStale: false, quantity: 2 }), false)
})
