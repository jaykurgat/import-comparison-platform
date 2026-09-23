'use client'

import { useState } from 'react'

export function ImportCheckoutForm({
  productId,
  skuId,
}: {
  productId: string
  skuId: string
}) {
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(formData: FormData) {
    setPending(true)
    setMessage(null)

    try {
      const response = await fetch('/api/checkout/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productId,
          skuId,
          quantity,
          fullName: String(formData.get('fullName') ?? ''),
          mobileNo: String(formData.get('mobileNo') ?? ''),
          country: 'KE',
          province: String(formData.get('province') ?? ''),
          city: String(formData.get('city') ?? ''),
          address: String(formData.get('address') ?? ''),
          address2: String(formData.get('address2') ?? ''),
          zip: String(formData.get('zip') ?? ''),
        }),
      })

      const body = await response.json()
      if (!response.ok) {
        setMessage(body.error ?? 'Unable to start checkout.')
        return
      }

      if (!body.checkoutUrl) {
        setMessage('M-PESA payment could not be started.')
        return
      }

      setMessage(body.paymentMessage ?? 'Check your phone and enter your M-PESA PIN to complete payment.')
      window.location.assign(body.checkoutUrl)
    } catch {
      setMessage('Unable to connect to checkout. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 p-4">
      <div className="text-sm font-bold">Checkout</div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Confirm your delivery details. We will send an M-PESA payment prompt to the mobile number you provide before the supplier order is submitted.
      </p>

      <form
        className="mt-4 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          void submit(new FormData(event.currentTarget))
        }}
      >
        <input name="fullName" required placeholder="Full name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        <input name="mobileNo" required placeholder="Mobile number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="province" required placeholder="County / province" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input name="city" required placeholder="City" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <input name="address" required placeholder="Street / delivery address" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="address2" placeholder="Apartment / additional details" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input name="zip" placeholder="Postal code" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Qty</label>
          <input type="number" min={1} max={20} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <button type="submit" disabled={pending} className="rounded-lg bg-[#0f5132] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {pending ? 'Preparing checkout…' : 'Continue to payment'}
          </button>
        </div>
      </form>

      {message && <p className="mt-3 text-sm text-[#A6432D]">{message}</p>}
    </div>
  )
}
