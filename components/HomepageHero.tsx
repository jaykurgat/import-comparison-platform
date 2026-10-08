'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { HeroConfig, HeroSlide } from '@/lib/homepage/hero'
import type { StorefrontCategory } from '@/lib/storefront/getCategories'

export default function HomepageHero({ config, categories }: { config: HeroConfig; categories: StorefrontCategory[] }) {
  const slides = config.slides?.length ? config.slides : []
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (config.mode !== 'carousel' || !config.autoplay || slides.length < 2) return
    const timer = setInterval(() => setIndex((current) => (current + 1) % slides.length), Math.max(2, config.autoplaySeconds || 5) * 1000)
    return () => clearInterval(timer)
  }, [config.mode, config.autoplay, config.autoplaySeconds, slides.length])
  if (!config.enabled || !slides.length) return null
  const slide = slides[index % slides.length]
  const opacity = Math.max(0, Math.min(1, slide.overlayOpacity ?? 0))

  return (
    <section className="grid min-w-0 grid-cols-1 gap-2 lg:grid-cols-[190px_minmax(0,1fr)_165px]">
      <aside className="hidden overflow-hidden rounded-sm border border-[#d5d9d9] bg-white lg:block">
        <div className="border-b border-[#e7e7e7] px-3 py-2 text-[13px] font-extrabold text-[#0f1111]">Shop by category</div>
        {categories.slice(0, 8).map((category) => (
          <Link key={category.id} href={{ pathname: '/products', query: { category: category.id } }} className="flex items-center gap-2 border-b border-[#e7e7e7] px-3 py-2 text-[12px] text-[#0f1111] transition hover:bg-[#f0f2f2] hover:text-[#007185]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff9900]" /> <span className="min-w-0 flex-1 truncate">{category.name}</span><span className="text-[#aaa]">›</span>
          </Link>
        ))}
      </aside>

      <div className="relative min-w-0 overflow-hidden rounded-sm border border-[#2d3e50] bg-[#131921] shadow-sm">
        {slide.imageUrl && <img src={slide.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: slide.imagePosition || 'center' }} />}
        {slide.imageUrl && opacity > 0 && <div className="absolute inset-0 bg-black" style={{ opacity }} />}
        <div className="relative flex min-h-[250px] flex-col justify-center overflow-hidden p-6 text-white sm:min-h-[300px] sm:p-9 lg:min-h-[300px]">
          <span className="mb-3 inline-flex w-fit rounded-sm bg-[#ff9900] px-2 py-1 text-[9px] font-black uppercase tracking-[.14em] text-[#131921]">⚡ New arrivals & deals</span>
          {slide.heading && <h1 className="max-w-2xl break-words text-3xl font-black leading-[1.08] tracking-[-.035em] sm:text-4xl">{slide.heading}</h1>}
          {slide.description && <p className="mt-3 max-w-xl text-xs leading-5 text-[#c8d0d8] sm:text-sm sm:leading-6">{slide.description}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {(slide.buttons || []).map((button, i) => <Link key={i} href={button.href || '#'} className="inline-flex min-h-9 items-center rounded-sm bg-[#ff9900] px-4 text-xs font-extrabold text-[#131921] transition hover:bg-[#e47911]">{button.label}</Link>)}
            <Link href="/products" className="inline-flex min-h-9 items-center rounded-sm border border-white/50 bg-white/10 px-4 text-xs font-bold text-white transition hover:bg-white/20">Shop all</Link>
          </div>
        </div>
        {slides.length > 1 && config.showArrows && <>
          <button type="button" aria-label="Previous hero slide" onClick={() => setIndex((index - 1 + slides.length) % slides.length)} className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-[#131921]">‹</button>
          <button type="button" aria-label="Next hero slide" onClick={() => setIndex((index + 1) % slides.length)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-[#131921]">›</button>
        </>}
      </div>

      <div className="hidden gap-2 lg:flex lg:flex-col">
        <Link href="/products?sort=newest" className="relative flex min-h-[145px] flex-1 overflow-hidden rounded-sm bg-gradient-to-br from-[#0d2136] to-[#1a3a52] p-3 text-white">
          <div><h3 className="text-[13px] font-extrabold">New arrivals</h3><p className="mt-1 text-[10px] text-white/65">Fresh products added regularly</p><span className="mt-4 inline-flex rounded-sm bg-[#ff9900] px-2 py-1 text-[9px] font-black text-[#131921]">Shop →</span></div>
          <span className="absolute bottom-1 right-2 text-4xl opacity-20">📦</span>
        </Link>
        <Link href="/products" className="relative flex min-h-[145px] flex-1 overflow-hidden rounded-sm bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-3 text-white">
          <div><h3 className="text-[13px] font-extrabold">Smart shopping</h3><p className="mt-1 text-[10px] text-white/65">Great prices, shipped to Kenya</p><span className="mt-4 inline-flex rounded-sm bg-[#ff9900] px-2 py-1 text-[9px] font-black text-[#131921]">Explore →</span></div>
          <span className="absolute bottom-1 right-2 text-4xl opacity-20">🛍️</span>
        </Link>
      </div>
    </section>
  )
}
