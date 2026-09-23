import test from 'node:test'
import assert from 'node:assert/strict'
import { parseDarajaCallback } from '../lib/payments/daraja'

test('Daraja callback parser captures payment amount and receipt', () => {
  const result = parseDarajaCallback({
    Body: {
      stkCallback: {
        MerchantRequestID: 'merchant-1',
        CheckoutRequestID: 'checkout-1',
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        CallbackMetadata: {
          Item: [
            { Name: 'Amount', Value: 1500 },
            { Name: 'MpesaReceiptNumber', Value: 'ABC123XYZ' },
          ],
        },
      },
    },
  })

  assert.equal(result.checkoutRequestId, 'checkout-1')
  assert.equal(result.amount, 1500)
  assert.equal(result.mpesaReceiptNumber, 'ABC123XYZ')
})

test('Daraja callback parser rejects callbacks without a checkout request id', () => {
  assert.throws(
    () => parseDarajaCallback({ Body: { stkCallback: { ResultCode: 0 } } }),
    /Invalid Daraja callback payload/,
  )
})
