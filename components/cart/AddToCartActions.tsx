'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCart, type CartItem } from './CartProvider'

export default function AddToCartActions({ item }: { item: CartItem }) {
  const router = useRouter()
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  function add(goToCheckout: boolean) {
    addItem({ ...item, quantity })
    if (goToCheckout) router.push('/checkout')
    else {
      setAdded(true)
      window.setTimeout(() => setAdded(false), 1800)
    }
  }

  if (item.availableStock < 1) {
    return <div className="mt-5 rounded-sm border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-900">Currently unavailable</div>
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
          Qty
          <input
            type="number"
            min={1}
            max={Math.min(20, item.availableStock)}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Math.min(Math.min(20, item.availableStock), Number(event.target.value) || 1)))}
            className="w-20 rounded-sm border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <button type="button" onClick={() => add(false)} className="rounded-sm border border-[#123f2b] bg-white px-5 py-3 text-sm font-black text-[#123f2b] hover:bg-[#f2f8f5]">
          {added ? 'Added to cart' : 'Add to Cart'}
        </button>
        <button type="button" onClick={() => add(true)} className="rounded-sm bg-[#123f2b] px-5 py-3 text-sm font-black text-white hover:bg-[#0d3021]">
          Buy Now
        </button>
      </div>
      {added && <p className="mt-2 text-xs font-bold text-emerald-700">Added to your cart.</p>}
    </div>
  )
}
