'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { HeroConfig, HeroSlide, HeroColumn } from '@/lib/homepage/hero'

function Buttons({ buttons = [] }: { buttons?: HeroSlide['buttons'] }) {
  return <div className="mt-4 flex max-w-full flex-wrap gap-2 sm:mt-5">
    {buttons.map((button, i) => <Link key={i} href={button.href || '#'} className="inline-flex min-h-10 max-w-full items-center justify-center truncate rounded-md border border-[#123f2b] bg-[#123f2b] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#0b2a21] sm:px-5 sm:text-sm">{button.label}</Link>)}
  </div>
}

function Column({ column }: { column: HeroColumn }) {
  const opacity = Math.max(0, Math.min(1, column.overlayOpacity ?? 0))
  const justify = column.verticalAlign === 'top' ? 'flex-start' : column.verticalAlign === 'bottom' ? 'flex-end' : 'center'
  return <div className="relative min-h-0 min-w-0 overflow-hidden" style={{ backgroundColor: column.backgroundColor || '#eef2ed' }}>
    {column.imageUrl && <img src={column.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: column.imagePosition || 'center' }} />}
    {column.imageUrl && opacity > 0 && <div className="absolute inset-0 bg-black" style={{ opacity }} />}
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden p-5 sm:p-7" style={{ color: column.textColor || '#10241d', textAlign: column.textAlign || 'left', justifyContent: justify }}>
      {column.heading && <h2 className="max-w-full break-words text-xl font-black tracking-tight sm:text-3xl">{column.heading}</h2>}
      {column.description && <p className="mt-2 max-w-xl overflow-hidden text-xs leading-5 opacity-90 sm:mt-3 sm:text-sm sm:leading-6">{column.description}</p>}
      <Buttons buttons={column.buttons} />
    </div>
  </div>
}

function Slide({ slide }: { slide: HeroSlide }) {
  const opacity = Math.max(0, Math.min(1, slide.overlayOpacity ?? 0))
  const justify = slide.verticalAlign === 'top' ? 'flex-start' : slide.verticalAlign === 'bottom' ? 'flex-end' : 'center'
  if ((slide.columns || []).length > 0) return <div className="grid h-full w-full grid-cols-1 sm:flex" style={{ backgroundColor: slide.backgroundColor || '#e8efe9' }}>{slide.columns!.map((column, i) => <div key={i} className="min-h-0 min-w-0 flex-1"><Column column={column} /></div>)}</div>
  return <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: slide.backgroundColor || '#e8efe9' }}>
    {slide.imageUrl && <img src={slide.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: slide.imagePosition || 'center' }} />}
    {slide.imageUrl && opacity > 0 && <div className="absolute inset-0 bg-black" style={{ opacity }} />}
    <div className="relative flex h-full min-w-0 flex-col overflow-hidden p-6 sm:p-9 lg:p-12" style={{ color: slide.textColor || '#10241d', textAlign: slide.textAlign || 'left', justifyContent: justify }}>
      {slide.heading && <h1 className="max-w-3xl break-words text-2xl font-black leading-[1.08] tracking-[-0.035em] sm:text-4xl lg:text-5xl">{slide.heading}</h1>}
      {slide.description && <p className="mt-3 max-w-2xl overflow-hidden text-xs leading-5 opacity-90 sm:mt-4 sm:text-base sm:leading-6">{slide.description}</p>}
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
  return <section className="relative h-[260px] overflow-hidden rounded-xl border border-[#dfe5e0] bg-white shadow-[0_6px_24px_rgba(18,32,24,.06)] sm:h-[340px] lg:h-[420px]" style={{ maxHeight: Math.max(220, config.height || 420), backgroundColor: config.backgroundColor }}>
    <Slide slide={active} />
    {config.mode === 'carousel' && slides.length > 1 && config.showArrows && <>
      <button type="button" aria-label="Previous hero slide" onClick={() => setIndex((index - 1 + slides.length) % slides.length)} className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-black/30 text-xl font-bold text-white backdrop-blur-sm sm:left-3">‹</button>
      <button type="button" aria-label="Next hero slide" onClick={() => setIndex((index + 1) % slides.length)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-black/30 text-xl font-bold text-white backdrop-blur-sm sm:right-3">›</button>
    </>}
    {config.mode === 'carousel' && slides.length > 1 && config.showDots && <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">{slides.map((_, i) => <button key={i} type="button" aria-label={'Show hero slide ' + (i + 1)} onClick={() => setIndex(i)} className={'h-1.5 rounded-full transition ' + (i === index ? 'w-7 bg-white' : 'w-1.5 bg-white/60')} />)}</div>}
  </section>
}
