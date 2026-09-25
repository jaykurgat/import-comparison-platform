'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/components/cart/CartProvider'

export default function CheckoutPage() {
  const { items, subtotal } = useCart()
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(form: HTMLFormElement) {
    setPending(true)
    setMessage(null)
    const data = new FormData(form)
    try {
      const response = await fetch('/api/checkout/cart', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            kind: item.kind,
            productId: item.productId,
            skuId: item.skuId,
            sku: item.sku,
            quantity: item.quantity,
          })),
          fullName: String(data.get('fullName') ?? ''),
          mobileNo: String(data.get('mobileNo') ?? ''),
          country: 'KE',
          province: String(data.get('province') ?? ''),
          city: String(data.get('city') ?? ''),
          address: String(data.get('address') ?? ''),
          address2: String(data.get('address2') ?? ''),
          zip: String(data.get('zip') ?? ''),
        }),
      })
      const body = await response.json()
      if (!response.ok) {
        setMessage(body.error ?? 'Unable to start checkout.')
        return
      }
      window.location.assign(body.checkoutUrl + '&token=' + encodeURIComponent(body.accessToken))
    } catch {
      setMessage('Unable to connect to checkout. Please try again.')
    } finally {
      setPending(false)
    }
  }

  if (items.length === 0) return <main className="min-h-screen bg-[#f7f7f3] p-8 text-center"><h1 className="text-2xl font-black">Your cart is empty</h1><Link href="/products" className="mt-4 inline-flex font-bold text-emerald-800">Shop products</Link></main>

  return (
    <main className="min-h-screen bg-[#f7f7f3] text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/cart" className="text-xs font-bold text-emerald-800">← Cart</Link>
        <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="border border-slate-200 bg-white p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Checkout</p>
            <h1 className="mt-2 text-3xl font-black">Delivery details</h1>
            <p className="mt-2 text-sm text-slate-500">Review your order, enter your delivery details, then continue to secure payment.</p>
            <form className="mt-6 grid gap-3" onSubmit={(e)=>{e.preventDefault();void submit(e.currentTarget)}}>
              <input name="fullName" required placeholder="Full name" autoComplete="name" className="border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#123f2b]" />
              <input name="mobileNo" required placeholder="M-PESA mobile number" autoComplete="tel" className="border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#123f2b]" />
              <div className="grid gap-3 sm:grid-cols-2"><input name="province" required placeholder="County" className="border border-slate-200 px-3.5 py-3 text-sm outline-none" /><input name="city" required placeholder="City / town" className="border border-slate-200 px-3.5 py-3 text-sm outline-none" /></div>
              <input name="address" required placeholder="Street / delivery address" className="border border-slate-200 px-3.5 py-3 text-sm outline-none" />
              <div className="grid gap-3 sm:grid-cols-2"><input name="address2" placeholder="Apartment / additional details" className="border border-slate-200 px-3.5 py-3 text-sm outline-none" /><input name="zip" placeholder="Postal code" className="border border-slate-200 px-3.5 py-3 text-sm outline-none" /></div>
              <button disabled={pending} className="mt-2 rounded-sm bg-[#123f2b] px-5 py-3.5 text-sm font-black text-white disabled:opacity-50">{pending ? 'Preparing order…' : 'Place order and continue to payment'}</button>
              {message && <p className="text-sm font-bold text-red-700">{message}</p>}
            </form>
          </section>
          <aside className="h-fit border border-slate-200 bg-white p-5">
            <div className="text-sm font-black">Your order</div>
            <div className="mt-4 space-y-3">{items.map(item=><div key={item.key} className="flex justify-between gap-4 text-sm"><span className="min-w-0 text-slate-600">{item.title} × {item.quantity}</span><span className="shrink-0 font-bold">KES {(item.price*item.quantity).toLocaleString()}</span></div>)}</div>
            <div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-base"><span className="font-black">Total</span><span className="font-black">KES {subtotal.toLocaleString()}</span></div>
          </aside>
        </div>
      </div>
    </main>
  )
}
