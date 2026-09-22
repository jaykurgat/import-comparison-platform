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
  const [result, setResult] = useState<{ orderId: string; customerTotal: number; currency: string; etaMinDays: number; etaMaxDays: number } | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(formData: FormData) {
    setPending(true)
    setMessage(null)
    setResult(null)

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
        placeOrder: false,
      }),
    })

    const body = await response.json()
    setPending(false)

    if (!response.ok) {
      setMessage(body.error ?? 'Unable to validate checkout.')
      return
    }

    setResult(body)
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 p-4">
      <div className="text-sm font-bold">Check import delivery</div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Enter your delivery details to validate the AliExpress destination and current freight before placing an order.
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
            {pending ? 'Checking…' : 'Validate delivery'}
          </button>
        </div>
      </form>

      {message && <p className="mt-3 text-sm text-[#A6432D]">{message}</p>}

      {result && (
        <div className="mt-4 rounded-lg bg-[#f2f8f5] p-4 text-sm">
          <p className="font-bold text-[#0f5132]">Delivery validated</p>
          <p className="mt-1">Checkout total: {result.currency} {result.customerTotal.toLocaleString()}</p>
          <p className="mt-1 text-slate-600">Estimated delivery: {result.etaMinDays}–{result.etaMaxDays} days.</p>
          <p className="mt-2 text-xs text-slate-500">Order intent: {result.orderId}. Payment/order submission is not triggered by this validation step.</p>
        </div>
      )}
    </div>
  )
}
