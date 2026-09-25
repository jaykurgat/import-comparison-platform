'use client'

import Link from 'next/link'
import { useCart } from '@/components/cart/CartProvider'

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart()

  return (
    <main className="min-h-screen bg-[#f7f7f3] text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">KijijiCart</p><h1 className="mt-2 text-3xl font-black">Shopping cart</h1></div>
          <Link href="/products" className="text-sm font-bold text-emerald-800 hover:underline">Continue shopping</Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-xl font-black">Your cart is empty</h2>
            <p className="mt-2 text-sm text-slate-500">Add products to your cart and they will appear here.</p>
            <Link href="/products" className="mt-5 inline-flex rounded-sm bg-[#123f2b] px-5 py-3 text-sm font-black text-white">Shop products</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="border border-slate-200 bg-white">
              {items.map((item) => (
                <div key={item.key} className="flex gap-4 border-b border-slate-100 p-5 last:border-b-0">
                  <div className="h-24 w-24 shrink-0 bg-[#f7f7f3]">
                    {item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-black leading-5">{item.title}</h2>
                    {Object.entries(item.options).length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{Object.entries(item.options).map(([name,value]) => <span key={name} className="bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{name}: {value}</span>)}</div>}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="font-black tabular-nums">{item.currency} {item.price.toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} max={Math.min(20,item.availableStock)} value={item.quantity} onChange={(e)=>updateQuantity(item.key, Number(e.target.value)||1)} className="w-16 border border-slate-200 px-2 py-1.5 text-sm" />
                        <button type="button" onClick={()=>removeItem(item.key)} className="text-xs font-bold text-slate-500 hover:text-red-700">Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
            <aside className="h-fit border border-slate-200 bg-white p-5">
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
