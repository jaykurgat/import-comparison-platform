'use client'

import Link from 'next/link'
import { useCart } from './cart/CartProvider'

export default function CartHeaderLink() {
  const { itemCount } = useCart()
  return (
    <Link href="/cart" className="relative inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-black text-slate-800 transition hover:bg-[#fff4d6] hover:text-[#123f2b] sm:text-sm">
      Cart
      {itemCount > 0 && <span className="min-w-5 rounded-full bg-[#f4b942] px-1.5 py-0.5 text-center text-[10px] font-black text-[#0b2a21]">{itemCount}</span>}
    </Link>
  )
}
