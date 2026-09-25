'use client'

import Link from 'next/link'
import { useCart } from './cart/CartProvider'

export default function CartHeaderLink() {
  const { itemCount } = useCart()
  return (
    <Link href="/cart" className="relative inline-flex items-center gap-2 rounded-sm px-2 py-2 text-sm font-black text-slate-800 hover:bg-white/10">
      Cart
      {itemCount > 0 && <span className="min-w-5 rounded-full bg-[#f5a400] px-1.5 py-0.5 text-center text-[10px] font-black text-[#0b2a21]">{itemCount}</span>}
    </Link>
  )
}
