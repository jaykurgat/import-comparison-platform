'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ProductTeaser } from '@/lib/storefront/productTeaser'

export default function HeroCarousel({ slides }: { slides: ProductTeaser[] }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  if (!slides.length) {
    return (
      <section className="flex min-h-[360px] items-center rounded-2xl bg-gradient-to-br from-[#0f5132] to-[#174f3d] p-8 text-white shadow-sm sm:p-12">
        <div className="max-w-xl"><p className="text-sm font-bold uppercase tracking-widest text-amber-300">KijijiCart</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Compare before you buy.</h1><p className="mt-4 max-w-lg text-base leading-7 text-white/80">See local Kenyan prices alongside landed import alternatives, with transparent pricing built into every comparison.</p><Link href="/products" className="mt-7 inline-flex rounded-lg bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-300">Browse products</Link></div>
      </section>
    )
  }

  const slide = slides[index]
  return (
    <section className="relative min-h-[360px] overflow-hidden rounded-2xl bg-white shadow-sm">
      <Link href={slide.href} className="grid h-full min-h-[360px] md:grid-cols-[1fr_42%]">
        <div className="flex flex-col justify-center p-7 sm:p-10">
          <span className="w-fit rounded-full bg-[#0f5132]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0f5132]">{slide.hasDeal ? 'Featured deal' : 'Featured product'}</span>
          <h1 className="mt-4 line-clamp-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{slide.title}</h1>
          <div className="mt-5 flex items-end gap-3"><span className="text-3xl font-black">{slide.currency} {slide.price.toLocaleString()}</span>{slide.savingsAmount !== null && <span className="pb-1 text-sm font-semibold text-emerald-700">Save {slide.currency} {slide.savingsAmount.toLocaleString()}</span>}</div>
          <span className="mt-6 w-fit rounded-lg bg-[#f59e0b] px-5 py-3 text-sm font-extrabold text-slate-950">Shop now →</span>
        </div>
        <div className="relative min-h-[260px] bg-slate-100">
          {slide.imageUrl ? <img src={slide.imageUrl} alt={slide.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">Product image</div>}
        </div>
      </Link>
      {slides.length > 1 && <div className="absolute bottom-4 left-7 flex gap-2">{slides.map((_, i) => <button key={i} onClick={() => setIndex(i)} aria-label={`Go to slide ${i + 1}`} className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-[#0f5132]' : 'w-2 bg-slate-300'}`} />)}</div>}
    </section>
  )
}
