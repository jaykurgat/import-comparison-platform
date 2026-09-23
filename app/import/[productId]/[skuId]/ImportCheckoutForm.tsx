'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { trackBeginCheckout } from '@/lib/analytics/events'

export function ImportCheckoutForm({
  productId,
  skuId,
  sellPrice,
  title,
}: {
  productId: string
  skuId: string
  sellPrice: number
  title: string
}) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(formData: FormData) {
    setPending(true)
    setMessage(null)
    const normalizedQuantity = Math.min(20, Math.max(1, Number(formData.get('quantity') ?? quantity) || 1))
    trackBeginCheckout(
      [{ item_id: productId + '-' + skuId, item_name: title, quantity: normalizedQuantity, price: sellPrice, currency: 'KES' }],
      sellPrice * normalizedQuantity,
      'KES',
    )

    try {
      const response = await fetch('/api/checkout/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productId,
          skuId,
          quantity: normalizedQuantity,
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

      if (!body.checkoutUrl || !body.accessToken) {
        setMessage('M-PESA payment could not be started.')
        return
      }

      setMessage(body.paymentMessage ?? 'Check your phone and enter your M-PESA PIN to complete payment.')
      const separator = body.checkoutUrl.includes('?') ? '&' : '?'
      router.push(body.checkoutUrl + separator + 'token=' + encodeURIComponent(body.accessToken))
    } catch {
      setMessage('Unable to connect to checkout. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 p-5">
      <div className="text-sm font-black">Checkout</div>
      <p className="mt-1 text-xs leading-5 text-slate-500">Confirm delivery details. M-PESA payment must be confirmed before the supplier order is submitted.</p>
      <form
        className="mt-4 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          void submit(new FormData(event.currentTarget))
        }}
      >
        <input name="fullName" required placeholder="Full name" autoComplete="name" className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#123f2b]" />
        <input name="mobileNo" required placeholder="M-PESA mobile number" autoComplete="tel" className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#123f2b]" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="province" required placeholder="County" autoComplete="address-level1" className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#123f2b]" />
          <input name="city" required placeholder="City / town" autoComplete="address-level2" className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#123f2b]" />
        </div>
        <input name="address" required placeholder="Street / delivery address" autoComplete="street-address" className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#123f2b]" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="address2" placeholder="Apartment / additional details" className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#123f2b]" />
          <input name="zip" placeholder="Postal code" autoComplete="postal-code" className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#123f2b]" />
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            Qty
            <input name="quantity" type="number" min={1} max={20} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <button type="submit" disabled={pending} className="rounded-xl bg-[#123f2b] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0d3021] disabled:cursor-wait disabled:opacity-50">
            {pending ? 'Preparing checkout…' : 'Continue to M-PESA'}
          </button>
        </div>
      </form>
      {message && <p className="mt-3 text-sm text-[#A6432D]">{message}</p>}
    </div>
  )
}
