'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { ProductTeaser } from '@/lib/storefront/productTeaser'

export default function HeroCarousel({ slides }: { slides: ProductTeaser[] }) {
  const [index, setIndex] = useState(0)

  const visibleCount = 3
  const visibleSlides = useMemo(() => {
    if (!slides.length) return []
    const count = Math.min(visibleCount, slides.length)
    return Array.from({ length: count }, (_, offset) => slides[(index + offset) % slides.length])
  }, [slides, index])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setIndex((current) => (current + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  if (!slides.length) {
    return (
      <section className="relative overflow-hidden rounded-sm bg-[#e8efe9] shadow-sm">
        <div className="grid min-h-[240px] items-center lg:min-h-[260px] lg:grid-cols-[1fr_1fr]">
          <div className="px-6 py-8 sm:px-9 lg:px-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">KijijiCart</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-5xl">
              Shop products from one catalogue.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
              Browse products, choose the options you want and shop when a listing is ready.
            </p>
            <Link href="/products" className="mt-5 inline-flex rounded-sm bg-[#123f2b] px-5 py-2.5 text-sm font-bold text-white">
              Start shopping
            </Link>
          </div>
          <div className="hidden h-full bg-[radial-gradient(circle_at_40%_35%,rgba(255,255,255,.9),transparent_38%),linear-gradient(135deg,#d4e0d7,#b5c9bb)] lg:block" aria-hidden="true" />
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden rounded-sm border border-slate-200 bg-[#f1f2ee] shadow-sm">
      <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 lg:grid-cols-3">
        {visibleSlides.map((slide) => (
          <Link
            key={slide.sku}
            href={slide.href}
            className="group flex min-w-0 flex-col overflow-hidden rounded-sm border border-slate-200 bg-white"
          >
            <div className="relative h-[190px] overflow-hidden bg-white sm:h-[205px] lg:h-[215px]">
              {slide.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="h-full w-full object-contain p-1 transition duration-500 group-hover:scale-[1.015]"
                  loading="eager"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">Image unavailable</div>
              )}
            </div>

            <div className="flex min-h-[112px] flex-col border-t border-slate-100 px-3 py-2.5">
              <h2 className="line-clamp-2 text-sm font-medium leading-[1.25rem] text-slate-800">
                {slide.title}
              </h2>

              <div className="mt-auto flex items-baseline justify-between gap-2 pt-2">
                <span className="text-base font-bold tabular-nums text-slate-950">
                  {slide.source === 'import' && slide.variantCount > 1 ? 'From ' : ''}
                  {slide.currency} {slide.price.toLocaleString()}
                </span>
                <span className="shrink-0 text-xs font-bold text-[#123f2b]">Shop →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-3 py-2">
          <div className="flex items-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.sku}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show featured products starting at slide ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-sm transition-all ${i === index ? 'w-7 bg-[#123f2b]' : 'w-1.5 bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Featured products
          </span>
        </div>
      )}
    </section>
  )
}
