'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ProductTeaser } from '@/lib/storefront/productTeaser'

export default function HeroCarousel({ slides }: { slides: ProductTeaser[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setIndex((current) => (current + 1) % slides.length), 5500)
    return () => clearInterval(timer)
  }, [slides.length])

  if (!slides.length) {
    return (
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[#efe9dc] shadow-sm">
        <div className="grid min-h-[430px] items-center lg:grid-cols-[1.05fr_.95fr]">
          <div className="px-7 py-12 sm:px-10 lg:px-14">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">KijijiCart marketplace</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Compare locally. Import with clarity.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Browse the local catalog and see verified import alternatives when the data supports a useful comparison.
            </p>
            <Link href="/products" className="mt-7 inline-flex rounded-xl bg-[#123f2b] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0d3021]">
              Shop products →
            </Link>
          </div>
          <div className="hidden h-full min-h-[430px] bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,.9),transparent_36%),linear-gradient(135deg,#d9e4d8,#b9ccb9)] lg:block" aria-hidden="true">
            <div className="flex h-full items-end p-10">
              <div className="rounded-2xl border border-white/60 bg-white/60 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Built around transparency</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-700">Local price, supplier price and available landed-cost inputs stay distinct.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const slide = slides[index]

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <Link href={slide.href} className="grid min-h-[430px] lg:grid-cols-[.92fr_1.08fr]">
        <div className="order-2 flex flex-col justify-center px-7 py-9 sm:px-10 lg:order-1 lg:px-14">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-800">
              {slide.hasDeal ? 'Import comparison' : 'Featured product'}
            </span>
          </div>
          <h1 className="mt-5 line-clamp-3 max-w-xl text-3xl font-black leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-5xl">
            {slide.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <span className="text-3xl font-black tabular-nums text-slate-950">{slide.currency} {slide.price.toLocaleString()}</span>
            {slide.savingsAmount !== null && (
              <span className="pb-1 text-sm font-bold text-emerald-700">Save {slide.currency} {slide.savingsAmount.toLocaleString()}</span>
            )}
          </div>
          <span className="mt-7 inline-flex w-fit rounded-xl bg-[#123f2b] px-5 py-3 text-sm font-black text-white">View product →</span>
        </div>

        <div className="relative order-1 min-h-[260px] overflow-hidden bg-[#f0f1ed] lg:order-2 lg:min-h-[430px]">
          {slide.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slide.imageUrl} alt="" className="h-full w-full object-cover transition duration-700" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">Product image unavailable</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/10" aria-hidden="true" />
        </div>
      </Link>

      {slides.length > 1 && (
        <div className="absolute bottom-5 left-7 z-10 flex items-center gap-2 sm:left-10">
          {slides.map((item, i) => (
            <button
              key={item.sku}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-9 bg-[#123f2b]' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
