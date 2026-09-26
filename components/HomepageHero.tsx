'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { HeroConfig, HeroSlide, HeroColumn } from '@/lib/homepage/hero'

function Buttons({ buttons = [] }: { buttons?: HeroSlide['buttons'] }) {
  return <div className="mt-5 flex flex-wrap gap-2">
    {buttons.map((button, i) => <Link key={i} href={button.href || '#'} className="inline-flex min-h-10 items-center justify-center border border-[#123F2B] bg-[#123F2B] px-5 text-sm font-bold text-white">{button.label}</Link>)}
  </div>
}
function Column({ column }: { column: HeroColumn }) {
  const opacity = Math.max(0, Math.min(1, column.overlayOpacity ?? 0))
  const justify = column.verticalAlign === 'top' ? 'flex-start' : column.verticalAlign === 'bottom' ? 'flex-end' : 'center'
  return <div className="relative min-w-0 overflow-hidden" style={{ flex: `${column.width || 1} 1 0%`, backgroundColor: column.backgroundColor || '#eef2ed' }}>
    {column.imageUrl && <img src={column.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: column.imagePosition || 'center' }} />}
    {column.imageUrl && opacity > 0 && <div className="absolute inset-0 bg-black" style={{ opacity }} />}
    <div className="relative flex h-full flex-col p-5 sm:p-7" style={{ color: column.textColor || '#10241d', textAlign: column.textAlign || 'left', justifyContent: justify }}>
      {column.heading && <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{column.heading}</h2>}
      {column.description && <p className="mt-3 text-sm leading-6 opacity-90">{column.description}</p>}
      <Buttons buttons={column.buttons} />
    </div>
  </div>
}
function Slide({ slide }: { slide: HeroSlide }) {
  const opacity = Math.max(0, Math.min(1, slide.overlayOpacity ?? 0))
  const justify = slide.verticalAlign === 'top' ? 'flex-start' : slide.verticalAlign === 'bottom' ? 'flex-end' : 'center'
  if ((slide.columns || []).length > 0) return <div className="flex h-full w-full" style={{ backgroundColor: slide.backgroundColor || '#e8efe9' }}>{slide.columns!.map((column, i) => <Column key={i} column={column} />)}</div>
  return <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: slide.backgroundColor || '#e8efe9' }}>
    {slide.imageUrl && <img src={slide.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: slide.imagePosition || 'center' }} />}
    {slide.imageUrl && opacity > 0 && <div className="absolute inset-0 bg-black" style={{ opacity }} />}
    <div className="relative flex h-full flex-col p-7 sm:p-10 lg:p-14" style={{ color: slide.textColor || '#10241d', textAlign: slide.textAlign || 'left', justifyContent: justify }}>
      {slide.heading && <h1 className="max-w-3xl text-3xl font-black tracking-[-0.035em] sm:text-4xl lg:text-5xl">{slide.heading}</h1>}
      {slide.description && <p className="mt-4 max-w-2xl text-sm leading-6 opacity-90 sm:text-base">{slide.description}</p>}
      <Buttons buttons={slide.buttons} />
    </div>
  </div>
}
export default function HomepageHero({ config }: { config: HeroConfig }) {
  const slides = config.slides?.length ? config.slides : []
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (config.mode !== 'carousel' || !config.autoplay || slides.length < 2) return
    const timer = setInterval(() => setIndex((current) => (current + 1) % slides.length), Math.max(2, config.autoplaySeconds || 5) * 1000)
    return () => clearInterval(timer)
  }, [config.mode, config.autoplay, config.autoplaySeconds, slides.length])
  if (!config.enabled || !slides.length) return null
  const active = slides[index % slides.length]
  return <section className="relative overflow-hidden border border-slate-200 bg-white shadow-sm" style={{ height: `${Math.max(220, config.height || 420)}px`, backgroundColor: config.backgroundColor }}>
    <Slide slide={active} />
    {config.mode === 'carousel' && slides.length > 1 && config.showArrows && <>
      <button type="button" aria-label="Previous hero slide" onClick={() => setIndex((index - 1 + slides.length) % slides.length)} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 border border-white/50 bg-black/30 px-3 py-2 text-xl font-bold text-white">‹</button>
      <button type="button" aria-label="Next hero slide" onClick={() => setIndex((index + 1) % slides.length)} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 border border-white/50 bg-black/30 px-3 py-2 text-xl font-bold text-white">›</button>
    </>}
    {config.mode === 'carousel' && slides.length > 1 && config.showDots && <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">{slides.map((_, i) => <button key={i} type="button" aria-label={`Show hero slide ${i + 1}`} onClick={() => setIndex(i)} className={`h-1.5 ${i === index ? 'w-7 bg-white' : 'w-1.5 bg-white/60'}`} />)}</div>}
  </section>
}
