'use client'

import { useRef, useState } from 'react'

export default function ProductGallery({
  title,
  imageUrls,
}: {
  title: string
  imageUrls: string[]
}) {
  const images = imageUrls.filter(Boolean)
  const [active, setActive] = useState(0)
  const touchStart = useRef<number | null>(null)

  const goTo = (next: number) => setActive((next + images.length) % images.length)
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStart.current = event.touches[0]?.clientX ?? null
  }
  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStart.current === null) return
    const end = event.changedTouches[0]?.clientX ?? touchStart.current
    const delta = end - touchStart.current
    touchStart.current = null
    if (Math.abs(delta) < 45 || images.length < 2) return
    goTo(active + (delta < 0 ? 1 : -1))
  }

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-sm bg-[#f1f1ec] text-sm font-semibold text-slate-400">
        Image unavailable
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[88px_1fr]">
      <div className="order-2 flex max-w-full gap-2 overflow-x-auto pb-1">
        {images.slice(0, 8).map((src, index) => (
          <button
            key={src + index}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`View product image ${index + 1}`}
            aria-pressed={active === index}
            className={`h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 bg-[#f1f1ec] transition sm:h-20 sm:w-20 ${active === index ? 'border-[#123f2b]' : 'border-transparent hover:border-slate-300'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" loading={index === 0 ? 'eager' : 'lazy'} />
          </button>
        ))}
      </div>

      <div\n        className="order-1 relative aspect-[4/3] w-full touch-pan-y select-none overflow-hidden rounded-sm bg-[#f1f1ec] sm:aspect-[5/4] lg:aspect-[4/3]"\n        onTouchStart={handleTouchStart}\n        onTouchEnd={handleTouchEnd}\n      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={title} className="h-full w-full object-contain" draggable={false} />
      </div>
    </div>
  )
}
