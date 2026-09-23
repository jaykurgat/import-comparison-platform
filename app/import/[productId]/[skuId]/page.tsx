export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getImportProductPageData } from '@/lib/product/getImportProductPageData'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { ImportCheckoutForm } from './ImportCheckoutForm'

export async function generateMetadata({ params }: { params: Promise<{ productId: string; skuId: string }> }): Promise<Metadata> {
  const { productId, skuId } = await params
  const data = await getImportProductPageData(productId, skuId)
  if (!data) return { title: 'Import product not found | KijijiCart' }
  const description = data.description?.replace(/<[^>]*>/g, '').slice(0, 155) || `Buy ${data.title} through the KijijiCart import marketplace.`
  return {
    title: `${data.title} | KijijiCart Import`,
    description,
    alternates: { canonical: `/import/${encodeURIComponent(productId)}/${encodeURIComponent(skuId)}` },
    openGraph: {
      title: data.title,
      description,
      type: 'website',
      images: data.imageUrls[0] ? [{ url: data.imageUrls[0], alt: data.title }] : undefined,
    },
  }
}

export default async function ImportProductPage({ params }: { params: Promise<{ productId: string; skuId: string }> }) {
  const { productId, skuId } = await params
  const data = await getImportProductPageData(productId, skuId)
  if (!data) notFound()

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f7f7f3] text-slate-950">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-9">
          <div className="mb-4 text-xs text-slate-500"><Link href="/products" className="font-semibold hover:text-[#0f5132]">Products</Link><span className="mx-1">/</span>Direct import</div>
          <div className="grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="aspect-square overflow-hidden rounded-xl bg-slate-50">
                {data.imageUrls[0] ? <img src={data.imageUrls[0]} alt={data.title} className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">No image available</div>}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">Direct import</span>
              <h1 className="mt-4 text-2xl font-black leading-tight sm:text-3xl">{data.title}</h1>
              <div className="mt-5 text-3xl font-black tracking-tight tabular-nums">{data.currency} {data.sellPrice.toLocaleString()}</div>
              <p className="mt-2 text-sm text-slate-500">Landed import price with marketplace markup · delivery estimate varies by supplier and destination</p>

              <div className="mt-6 rounded-2xl bg-[#f7f7f3] p-4">
                <div className="text-sm font-bold">Import fulfillment</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">Price reflects the current landed-cost estimate and markup. Delivery timing, freight, and exchange rates can change.</p>
              </div>

              <ImportCheckoutForm productId={data.productId} skuId={data.skuId} sellPrice={data.sellPrice} />

              <a href={data.aliExpressUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#0f5132] px-5 py-3 text-sm font-bold text-white hover:bg-[#0b4128]">View supplier listing →</a>
              {data.description && <div className="mt-7 border-t border-slate-100 pt-6 text-sm leading-6 text-slate-600" dangerouslySetInnerHTML={{ __html: data.description }} />}
              {data.isStale && <p className="mt-5 text-xs text-slate-400">Price last confirmed {data.priceDataAsOf.toLocaleDateString()} — may have changed.</p>}
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
