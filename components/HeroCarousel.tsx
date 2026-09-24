'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ProductTeaser } from '@/lib/storefront/productTeaser'

export default function HeroCarousel({ slides }: { slides: ProductTeaser[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setIndex((current) => (current + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  if (!slides.length) {
    return (
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[#e8efe9] shadow-sm">
        <div className="grid min-h-[420px] items-center lg:grid-cols-[1fr_.95fr]">
          <div className="px-7 py-12 sm:px-10 lg:px-14">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">KijijiCart</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
              Shop local products and import alternatives.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Browse real products, compare available options and continue to checkout when a listing is ready.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex rounded-xl bg-[#123f2b] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0d3021]">
                Start shopping
              </Link>
              <Link href="/products?source=import" className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-400">
                Shop direct imports
              </Link>
            </div>
          </div>
          <div className="hidden min-h-[420px] bg-[radial-gradient(circle_at_40%_35%,rgba(255,255,255,.9),transparent_38%),linear-gradient(135deg,#d4e0d7,#b5c9bb)] lg:block" aria-hidden="true" />
        </div>
      </section>
    )
  }

  const slide = slides[index]

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-white shadow-sm">
      <Link href={slide.href} className="grid min-h-[420px] lg:grid-cols-[.9fr_1.1fr]">
        <div className="order-2 flex flex-col justify-center px-7 py-9 sm:px-10 lg:order-1 lg:px-14">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              {slide.source === 'import' ? 'Direct import' : slide.hasDeal ? 'Import comparison' : 'Featured product'}
            </span>
            {slide.variantCount > 1 && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                {slide.variantCount} variants
              </span>
            )}
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Shop this pick</p>
          <h1 className="mt-2 line-clamp-3 max-w-xl text-3xl font-black leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-5xl">
            {slide.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-black tabular-nums text-slate-950">{slide.currency} {slide.price.toLocaleString()}</span>
            {slide.savingsAmount !== null && (
              <span className="text-sm font-bold text-emerald-700">Save {slide.currency} {slide.savingsAmount.toLocaleString()}</span>
            )}
          </div>
          <span className="mt-7 inline-flex w-fit rounded-xl bg-[#123f2b] px-5 py-3 text-sm font-black text-white">Shop now →</span>
        </div>

        <div className="relative order-1 min-h-[260px] overflow-hidden bg-[#f0f1ed] lg:order-2 lg:min-h-[420px]">
          {slide.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slide.imageUrl} alt={slide.title} className="h-full w-full object-cover transition duration-700" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">Product image unavailable</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/10" aria-hidden="true" />
        </div>
      </Link>

      {slides.length > 1 && (
        <div className="absolute bottom-5 left-7 right-7 z-10 flex items-center justify-between sm:left-10 sm:right-10">
          <div className="flex items-center gap-2">
            {slides.map((item, i) => (
              <button
                key={item.sku}
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  setIndex(i)
                }}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-9 bg-[#123f2b]' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>
          <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-slate-500 shadow-sm">
            {index + 1} / {slides.length}
          </span>
        </div>
      )}
    </section>
  )
}
