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
      <div className="flex aspect-square items-center justify-center bg-[#eaeded] text-sm font-semibold text-slate-400">
        Image unavailable
      </div>
    )
  }

  return (
    <div className="kc-gallery">
      <div className="flex items-start gap-3">
        <div className="hidden h-[min(560px,calc(100vh-230px))] w-16 shrink-0 flex-col gap-2 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin] lg:flex">
          {images.slice(0, 24).map((src, index) => (
            <button
              key={src + index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View product image ${index + 1}`}
              aria-pressed={active === index}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-[#f7f8f8] p-0.5 transition ${active === index ? 'border-[#0e4f3a]' : 'border-slate-200 hover:border-slate-300'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-contain" loading={index === 0 ? 'eager' : 'lazy'} />
            </button>
          ))}
        </div>

        <div
          className="kc-gallery-stage relative flex min-h-0 min-w-0 flex-1 touch-pan-y select-none items-center justify-center overflow-hidden rounded-sm border border-slate-200 bg-[#f7f8f8] aspect-square lg:aspect-auto lg:h-[min(560px,calc(100vh-230px))]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[active]} alt={title} className="h-auto w-auto max-h-[88%] max-w-[88%] object-contain" draggable={false} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.slice(0, 12).map((src, index) => (
          <button
            key={src + index}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`View product image ${index + 1}`}
            aria-pressed={active === index}
            className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-[#f7f8f8] p-0.5 transition sm:h-16 sm:w-16 ${active === index ? 'border-[#0e4f3a]' : 'border-slate-200 hover:border-slate-300'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-contain" loading={index === 0 ? 'eager' : 'lazy'} />
          </button>
        ))}
      </div>

      {images.length > 1 && (
        <div className="pointer-events-none flex justify-center gap-1.5 sm:hidden">
          {images.slice(0, 8).map((_, index) => (
            <span key={index} className={`h-1.5 w-1.5 rounded-full ${active === index ? 'bg-[#0e4f3a]' : 'bg-slate-300'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
