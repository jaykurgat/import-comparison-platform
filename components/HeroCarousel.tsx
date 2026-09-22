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

  if (slides.length === 0) return null

  const slide = slides[index]

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#EDEDEC] bg-[#FAFAF9]">
      <Link
        href={slide.href}
        className="flex flex-col items-center gap-6 p-8 md:flex-row md:p-12"
      >
        {slide.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slide.imageUrl} alt={slide.title} className="h-56 w-56 rounded-lg object-cover" />
        )}
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-[#1B5E4A]">Featured deal</div>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">{slide.title}</h2>
          <div className="mt-3 text-2xl font-semibold tabular-nums">
            {slide.currency} {slide.price.toLocaleString()}
          </div>
          {slide.savingsAmount !== null && (
            <div className="mt-1 text-sm font-medium text-[#1B5E4A]">
              Save {slide.currency} {slide.savingsAmount.toLocaleString()} vs local price
            </div>
          )}
        </div>
      </Link>

      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 w-6 rounded-full transition ${
                i === index ? 'bg-[#1B5E4A]' : 'bg-[#EDEDEC]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
