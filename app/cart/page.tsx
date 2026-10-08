'use client'

import Link from 'next/link'
import { useCart } from '@/components/cart/CartProvider'

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart()
  const hasImportedItems = items.some((item) => item.kind === 'supplier')

  return (
    <main className="kc-page min-h-screen bg-[#f7f7f3] text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">KijijiCart</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Shopping cart</h1></div>
          <Link href="/products" className="text-sm font-bold text-emerald-800 hover:underline">Continue shopping</Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-xl font-black">Your cart is empty</h2>
            <p className="mt-2 text-sm text-slate-500">Add products to your cart and they will appear here.</p>
            <Link href="/products" className="mt-5 inline-flex rounded-sm bg-[#123f2b] px-5 py-3 text-sm font-black text-white">Shop products</Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px] lg:gap-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {items.map((item) => (
                <div key={item.key} className="flex gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:gap-4 sm:p-5">
                  <div className="h-20 w-20 shrink-0 rounded-xl bg-[#f7f7f3] sm:h-24 sm:w-24">
                    {item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-black leading-5">{item.title}</h2>
                    {Object.entries(item.options).length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{Object.entries(item.options).map(([name,value]) => <span key={name} className="bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{name}: {value}</span>)}</div>}
                    {item.kind === 'supplier' && (
                      <p className="mt-2 text-[10px] leading-4 text-slate-400">Estimated delivery: 14–45 days. Delivery times may vary.</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="font-black tabular-nums">{item.currency} {item.price.toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} max={Math.min(20,item.availableStock)} value={item.quantity} onChange={(e)=>updateQuantity(item.key, Number(e.target.value)||1)} className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm" />
                        <button type="button" onClick={()=>removeItem(item.key)} className="text-xs font-bold text-slate-500 hover:text-red-700">Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28">
              <div className="text-sm font-black">Order summary</div>
              <div className="mt-5 flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-black tabular-nums">KES {subtotal.toLocaleString()}</span></div>
              <div className="mt-2 flex justify-between border-t border-slate-100 pt-3 text-base"><span className="font-black">Total</span><span className="font-black tabular-nums">KES {subtotal.toLocaleString()}</span></div>
              <Link href="/checkout" className="mt-5 flex w-full items-center justify-center rounded-sm bg-[#123f2b] px-5 py-3 text-sm font-black text-white hover:bg-[#0d3021]">Proceed to checkout</Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
