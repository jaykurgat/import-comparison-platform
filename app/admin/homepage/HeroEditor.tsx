'use client'

import { useState } from 'react'
import type { HeroConfig, HeroSlide, HeroColumn } from '@/lib/homepage/hero'
import { saveHomepageHero, resetHomepageHero } from './actions'

const blankSlide = (): HeroSlide => ({ backgroundColor: '#e8efe9', overlayOpacity: 0, textColor: '#10241d', textAlign: 'left', verticalAlign: 'center', heading: '', description: '', imageUrl: '', buttons: [], columns: [] })
const blankColumn = (): HeroColumn => ({ width: 1, backgroundColor: '#eef2ed', overlayOpacity: 0, imageUrl: '', heading: '', description: '', textColor: '#10241d', textAlign: 'left', verticalAlign: 'center', buttons: [] })

export default function HeroEditor({ initial }: { initial: HeroConfig }) {
  const [config, setConfig] = useState<HeroConfig>(initial)
  const [selected, setSelected] = useState(0)
  const [saved, setSaved] = useState(false)
  const slide = config.slides[selected] || config.slides[0]

  const patchConfig = (patch: Partial<HeroConfig>) => setConfig((c) => ({ ...c, ...patch }))
  const patchSlide = (patch: Partial<HeroSlide>) => setConfig((c) => ({ ...c, slides: c.slides.map((s, i) => i === selected ? { ...s, ...patch } : s) }))
  const patchColumn = (i: number, patch: Partial<HeroColumn>) => patchSlide({ columns: (slide.columns || []).map((c, n) => n === i ? { ...c, ...patch } : c) })

  return <div className="space-y-6">
    <form action={async (fd) => { await saveHomepageHero(fd); setSaved(true); setTimeout(() => setSaved(false), 2500) }}>
      <input type="hidden" name="config" value={JSON.stringify(config)} />
      <section className="border border-[#E3E3DF] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="text-lg font-black">Homepage Hero</h2><p className="mt-1 text-sm text-[#6B6B6E]">Build the storefront banner without touching code.</p></div>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={config.enabled} onChange={e => patchConfig({ enabled: e.target.checked })} /> Published</label>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <label className="text-sm font-bold">Layout<select className="mt-2 w-full border p-2 font-normal" value={config.mode} onChange={e => patchConfig({ mode: e.target.value as HeroConfig['mode'] })}><option value="banner">Single banner</option><option value="carousel">Carousel</option><option value="grid">Columns / grid</option></select></label>
          <label className="text-sm font-bold">Height (px)<input className="mt-2 w-full border p-2 font-normal" type="number" min="220" max="900" value={config.height} onChange={e => patchConfig({ height: Number(e.target.value) })} /></label>
          <label className="text-sm font-bold">Background<input className="mt-2 h-10 w-full border p-1" type="color" value={config.backgroundColor} onChange={e => patchConfig({ backgroundColor: e.target.value })} /></label>
          <div className="flex items-end gap-3 pb-2 text-sm"><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={config.autoplay} onChange={e => patchConfig({ autoplay: e.target.checked })} /> Autoplay</label><input className="w-20 border p-2" type="number" min="2" max="30" value={config.autoplaySeconds} onChange={e => patchConfig({ autoplaySeconds: Number(e.target.value) })} /></div>
        </div>
        {config.mode === 'carousel' && <div className="mt-4 flex gap-5 text-sm"><label className="flex gap-2"><input type="checkbox" checked={config.showArrows} onChange={e => patchConfig({ showArrows: e.target.checked })} /> Arrows</label><label className="flex gap-2"><input type="checkbox" checked={config.showDots} onChange={e => patchConfig({ showDots: e.target.checked })} /> Dots</label></div>}
      </section>

      <section className="border border-[#E3E3DF] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">Slides</h2><p className="text-sm text-[#6B6B6E]">Each slide can be a full banner or split into any number of columns.</p></div><button type="button" className="border bg-[#123F2B] px-4 py-2 text-sm font-bold text-white" onClick={() => { setConfig(c => ({ ...c, slides: [...c.slides, blankSlide()] })); setSelected(config.slides.length) }}>+ Add slide</button></div>
        <div className="mt-5 flex flex-wrap gap-2">{config.slides.map((_, i) => <button key={i} type="button" onClick={() => setSelected(i)} className={`border px-3 py-2 text-sm font-bold ${i === selected ? 'border-[#123F2B] bg-[#123F2B] text-white' : 'bg-white'}`}>Slide {i + 1}</button>)}</div>

        {slide && <div className="mt-6 border-t pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-bold md:col-span-2">Background image URL<input className="mt-2 w-full border p-2 font-normal" value={slide.imageUrl || ''} onChange={e => patchSlide({ imageUrl: e.target.value })} placeholder="https://..." /></label>
            <label className="text-sm font-bold">Background<input className="mt-2 h-10 w-full border p-1" type="color" value={slide.backgroundColor || '#e8efe9'} onChange={e => patchSlide({ backgroundColor: e.target.value })} /></label>
            <label className="text-sm font-bold">Overlay / dimming<input className="mt-3 w-full" type="range" min="0" max="0.9" step="0.05" value={slide.overlayOpacity || 0} onChange={e => patchSlide({ overlayOpacity: Number(e.target.value) })} /></label>
            <label className="text-sm font-bold">Image position<select className="mt-2 w-full border p-2 font-normal" value={slide.imagePosition || 'center'} onChange={e => patchSlide({ imagePosition: e.target.value as HeroSlide['imagePosition'] })}><option>left</option><option>center</option><option>right</option></select></label>
            <label className="text-sm font-bold">Text color<input className="mt-2 h-10 w-full border p-1" type="color" value={slide.textColor || '#10241d'} onChange={e => patchSlide({ textColor: e.target.value })} /></label>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold">Heading<input className="mt-2 w-full border p-2 font-normal" value={slide.heading || ''} onChange={e => patchSlide({ heading: e.target.value })} /></label>
            <label className="text-sm font-bold">Description<textarea className="mt-2 min-h-24 w-full border p-2 font-normal" value={slide.description || ''} onChange={e => patchSlide({ description: e.target.value })} /></label>
            <label className="text-sm font-bold">Text alignment<select className="mt-2 w-full border p-2 font-normal" value={slide.textAlign || 'left'} onChange={e => patchSlide({ textAlign: e.target.value as HeroSlide['textAlign'] })}><option>left</option><option>center</option><option>right</option></select></label>
            <label className="text-sm font-bold">Vertical alignment<select className="mt-2 w-full border p-2 font-normal" value={slide.verticalAlign || 'center'} onChange={e => patchSlide({ verticalAlign: e.target.value as HeroSlide['verticalAlign'] })}><option>top</option><option>center</option><option>bottom</option></select></label>
          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-5"><h3 className="font-black">Buttons</h3><button type="button" className="border px-3 py-2 text-sm font-bold" onClick={() => patchSlide({ buttons: [...(slide.buttons || []), { label: 'Shop now', href: '/products' }] })}>+ Add button</button></div>
          <div className="mt-3 space-y-2">{(slide.buttons || []).map((b, i) => <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input className="border p-2 text-sm" value={b.label} onChange={e => patchSlide({ buttons: (slide.buttons || []).map((x,n)=>n===i?{...x,label:e.target.value}:x) })} placeholder="Button text" /><input className="border p-2 text-sm" value={b.href} onChange={e => patchSlide({ buttons: (slide.buttons || []).map((x,n)=>n===i?{...x,href:e.target.value}:x) })} placeholder="/products" /><button type="button" className="border px-3 text-sm font-bold" onClick={() => patchSlide({ buttons: (slide.buttons || []).filter((_,n)=>n!==i) })}>Remove</button></div>)}</div>

          <div className="mt-8 border-t pt-6">
            <div className="flex items-center justify-between"><div><h3 className="font-black">Columns</h3><p className="mt-1 text-xs text-[#6B6B6E]">Use 2, 3, 4 or any number of columns. Width controls relative space.</p></div><button type="button" className="border px-3 py-2 text-sm font-bold" onClick={() => patchSlide({ columns: [...(slide.columns || []), blankColumn()] })}>+ Add column</button></div>
            <div className="mt-4 space-y-4">{(slide.columns || []).map((column, i) => <div key={i} className="border border-[#E3E3DF] p-4">
              <div className="flex items-center justify-between"><h4 className="font-black">Column {i + 1}</h4><button type="button" className="text-sm font-bold text-[#A6432D]" onClick={() => patchSlide({ columns: (slide.columns || []).filter((_,n)=>n!==i) })}>Remove</button></div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <label className="text-xs font-bold">Width<input className="mt-1 w-full border p-2" type="number" min="1" max="10" value={column.width || 1} onChange={e=>patchColumn(i,{width:Number(e.target.value)})}/></label>
                <label className="text-xs font-bold md:col-span-2">Image URL<input className="mt-1 w-full border p-2 font-normal" value={column.imageUrl || ''} onChange={e=>patchColumn(i,{imageUrl:e.target.value})}/></label>
                <label className="text-xs font-bold">Background<input className="mt-1 h-9 w-full border p-1" type="color" value={column.backgroundColor || '#eef2ed'} onChange={e=>patchColumn(i,{backgroundColor:e.target.value})}/></label>
                <label className="text-xs font-bold">Overlay<input className="mt-2 w-full" type="range" min="0" max="0.9" step="0.05" value={column.overlayOpacity || 0} onChange={e=>patchColumn(i,{overlayOpacity:Number(e.target.value)})}/></label>
                <label className="text-xs font-bold md:col-span-2">Heading<input className="mt-1 w-full border p-2 font-normal" value={column.heading || ''} onChange={e=>patchColumn(i,{heading:e.target.value})}/></label>
                <label className="text-xs font-bold">Text color<input className="mt-1 h-9 w-full border p-1" type="color" value={column.textColor || '#10241d'} onChange={e=>patchColumn(i,{textColor:e.target.value})}/></label>
                <label className="text-xs font-bold md:col-span-4">Description<textarea className="mt-1 w-full border p-2 font-normal" value={column.description || ''} onChange={e=>patchColumn(i,{description:e.target.value})}/></label>
              </div>
            </div>)}</div>
          </div>
          {config.slides.length > 1 && <button type="button" className="mt-6 border px-3 py-2 text-sm font-bold text-[#A6432D]" onClick={() => { setConfig(c=>({...c,slides:c.slides.filter((_,i)=>i!==selected)})); setSelected(Math.max(0, selected-1)) }}>Delete current slide</button>}
        </div>}
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="border bg-[#123F2B] px-6 py-3 text-sm font-black text-white">Save & publish hero</button>
        <button formAction={async () => { await resetHomepageHero(); setConfig(initial); setSelected(0) }} type="submit" className="border px-6 py-3 text-sm font-bold">Reset</button>
        {saved && <span className="self-center text-sm font-bold text-[#2F6B4F]">Saved.</span>}
      </div>
    </form>
  </div>
}
