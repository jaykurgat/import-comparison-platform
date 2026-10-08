'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/components/cart/CartProvider'

export default function CheckoutPage() {
  const { items, subtotal } = useCart()
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [coupon, setCoupon] = useState('')
  const [couponPreview, setCouponPreview] = useState<{ code:string; discount:number; total:number; percent:number } | null>(null)
  const [couponMessage, setCouponMessage] = useState<string | null>(null)
  const [couponPending, setCouponPending] = useState(false)

  async function previewCoupon() {
    const code = coupon.trim()
    if (!code) { setCouponPreview(null); setCouponMessage(null); return }
    setCouponPending(true); setCouponMessage(null)
    try {
      const response = await fetch('/api/checkout/coupon', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ code, items:items.map((item)=>({kind:item.kind,productId:item.productId,skuId:item.skuId,sku:item.sku,quantity:item.quantity})) }) })
      const body = await response.json()
      if (!response.ok) { setCouponPreview(null); setCouponMessage(body.error ?? 'That coupon could not be applied.'); return }
      setCouponPreview(body)
    } catch { setCouponPreview(null); setCouponMessage('Unable to validate the coupon right now.') }
    finally { setCouponPending(false) }
  }

  async function submit(form: HTMLFormElement) {
    setPending(true); setMessage(null)
    const data = new FormData(form)
    try {
      const response = await fetch('/api/checkout/cart', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({
        items:items.map((item)=>({kind:item.kind,productId:item.productId,skuId:item.skuId,sku:item.sku,quantity:item.quantity})),
        couponCode:coupon.trim(), fullName:String(data.get('fullName')??''), email:String(data.get('email')??''), mobileNo:String(data.get('mobileNo')??''), country:'KE',
        province:String(data.get('province')??''), city:String(data.get('city')??''), address:String(data.get('address')??''), address2:String(data.get('address2')??''), zip:String(data.get('zip')??'')
      })})
      const body = await response.json()
      if (!response.ok) { setMessage(body.error ?? 'Unable to start checkout.'); return }
      window.location.assign(body.checkoutUrl + '&token=' + encodeURIComponent(body.accessToken))
    } catch { setMessage('Unable to connect to checkout. Please try again.') }
    finally { setPending(false) }
  }

  if (items.length === 0) return <main className="min-h-screen bg-[#f7f7f3] p-8 text-center"><h1 className="text-2xl font-black">Your cart is empty</h1><Link href="/products" className="mt-4 inline-flex font-bold text-emerald-800">Shop products</Link></main>
  const hasImportedItems = items.some((item)=>item.kind==='supplier')
  const total = couponPreview?.total ?? subtotal

  return <main className="kc-page min-h-screen bg-[#f7f7f3] text-slate-950"><div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10"><Link href="/cart" className="text-xs font-bold text-emerald-800">← Cart</Link><div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px] lg:gap-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-7"><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Checkout</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Delivery details</h1><p className="mt-2 text-sm text-slate-500">Review your order, enter your delivery details, then continue to secure payment.</p>{hasImportedItems && <p className="mt-2 text-[11px] leading-4 text-slate-400">Imported items are estimated to arrive within 14–45 days. Delivery times may vary.</p>}
      <form className="mt-6 grid gap-3" onSubmit={(e)=>{e.preventDefault();void submit(e.currentTarget)}}><input name="fullName" required placeholder="Full name" autoComplete="name" className="border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#123f2b]" /><input name="email" required type="email" placeholder="Email address" autoComplete="email" className="border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#123f2b]" /><input name="mobileNo" required placeholder="M-PESA mobile number" autoComplete="tel" className="border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#123f2b]" /><div className="grid gap-3 sm:grid-cols-2"><input name="province" required placeholder="County" className="border border-slate-200 px-3.5 py-3 text-sm outline-none" /><input name="city" required placeholder="City / town" className="border border-slate-200 px-3.5 py-3 text-sm outline-none" /></div><input name="address" required placeholder="Street / delivery address" className="border border-slate-200 px-3.5 py-3 text-sm outline-none" /><div className="grid gap-3 sm:grid-cols-2"><input name="address2" placeholder="Apartment / additional details" className="border border-slate-200 px-3.5 py-3 text-sm outline-none" /><input name="zip" placeholder="Postal code" className="border border-slate-200 px-3.5 py-3 text-sm outline-none" /></div>
        <div className="border border-slate-200 bg-[#fbfbf8] p-4"><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-black">Have a coupon?</div><div className="mt-0.5 text-xs text-slate-500">Enter a code for eligible products.</div></div>{couponPreview && <span className="bg-[#fff4d6] px-2.5 py-1 text-[10px] font-black text-[#8a5a00]">{couponPreview.percent}% OFF</span>}</div><div className="mt-3 flex gap-2"><input value={coupon} onChange={(e)=>setCoupon(e.target.value.toUpperCase())} placeholder="COUPON CODE" className="min-w-0 flex-1 border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold tracking-[0.08em] outline-none focus:border-[#123f2b]" /><button type="button" onClick={()=>void previewCoupon()} disabled={couponPending} className="border border-[#123f2b] bg-[#123f2b] px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">{couponPending?'Checking…':'Apply'}</button></div>{couponMessage && <p className="mt-2 text-xs font-bold text-red-700">{couponMessage}</p>}</div>
        <button disabled={pending} className="mt-2 rounded-sm bg-[#123f2b] px-5 py-3.5 text-sm font-black text-white disabled:opacity-50">{pending?'Preparing order…':'Place order & pay with M-PESA'}</button>{message && <p className="text-sm font-bold text-red-700">{message}</p>}
      </form>
    </section>
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28"><div className="text-sm font-black">Your order</div><div className="mt-4 space-y-3">{items.map((item)=><div key={item.key} className="flex justify-between gap-4 text-sm"><span className="min-w-0 text-slate-600">{item.title} × {item.quantity}</span><span className="shrink-0 font-bold">KES {(item.price*item.quantity).toLocaleString()}</span></div>)}</div><div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-bold">KES {subtotal.toLocaleString()}</span></div>{couponPreview && <div className="flex justify-between text-emerald-800"><span>Coupon ({couponPreview.code})</span><span className="font-bold">− KES {couponPreview.discount.toLocaleString()}</span></div>}<div className="flex justify-between pt-2 text-base"><span className="font-black">Total</span><span className="font-black">KES {total.toLocaleString()}</span></div></div></aside>
  </div></div></main>
}