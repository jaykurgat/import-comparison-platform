'use client'

import { useState } from 'react'

export default function ProductGallery({
  title,
  imageUrls,
}: {
  title: string
  imageUrls: string[]
}) {
  const images = imageUrls.filter(Boolean)
  const [active, setActive] = useState(0)

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-sm bg-[#f1f1ec] text-sm font-semibold text-slate-400">
        Image unavailable
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[88px_1fr]">
      <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
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

      <div className="order-1 aspect-square overflow-hidden rounded-sm bg-[#f1f1ec] sm:order-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={title} className="h-full w-full object-contain" />
      </div>
    </div>
  )
}
