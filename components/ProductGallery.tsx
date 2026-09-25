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
      <div className="flex aspect-square items-center justify-center bg-[#f7f7f3] text-sm font-semibold text-slate-400">
        Image unavailable
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-square w-full touch-pan-y select-none overflow-hidden bg-[#f7f7f3] lg:h-[min(720px,calc(100vh-250px))] lg:aspect-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={title} className="h-full w-full object-contain" draggable={false} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.slice(0, 12).map((src, index) => (
          <button
            key={src + index}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`View product image ${index + 1}`}
            aria-pressed={active === index}
            className={`h-16 w-16 shrink-0 overflow-hidden border-2 bg-[#f7f7f3] transition ${active === index ? 'border-[#123f2b]' : 'border-transparent hover:border-slate-300'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-contain" loading={index === 0 ? 'eager' : 'lazy'} />
          </button>
        ))}
      </div>

      {images.length > 1 && (
        <div className="pointer-events-none flex justify-center gap-1.5 sm:hidden">
          {images.slice(0, 8).map((_, index) => (
            <span key={index} className={`h-1.5 w-1.5 ${active === index ? 'bg-[#123f2b]' : 'bg-slate-300'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
