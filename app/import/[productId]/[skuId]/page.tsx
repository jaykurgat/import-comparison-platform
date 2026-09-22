import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getImportProductPageData } from '@/lib/product/getImportProductPageData'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default async function ImportProductPage({ params }: { params: Promise<{ productId: string; skuId: string }> }) {
  const { productId, skuId } = await params
  const data = await getImportProductPageData(productId, skuId)
  if (!data) notFound()

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f5f6f7] text-slate-950">
        <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:py-8">
          <div className="mb-4 text-xs text-slate-500"><Link href="/products" className="font-semibold hover:text-[#0f5132]">Products</Link><span className="mx-1">/</span>Direct import</div>
          <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
            <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <div className="aspect-square overflow-hidden rounded-xl bg-slate-50">
                {data.imageUrls[0] ? <img src={data.imageUrls[0]} alt={data.title} className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">No image available</div>}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7">
              <span className="rounded-full bg-[#e7f3ee] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0f5132]">Direct import</span>
              <h1 className="mt-4 text-2xl font-black leading-tight sm:text-3xl">{data.title}</h1>
              <div className="mt-5 text-3xl font-black tabular-nums">{data.currency} {data.sellPrice.toLocaleString()}</div>
              <p className="mt-2 text-sm text-slate-500">Landed import price with marketplace markup · estimated 7–14 days</p>

              <div className="mt-6 rounded-xl border border-slate-200 p-4">
                <div className="flex justify-between text-sm"><span className="font-bold">Import fulfillment</span><span className="font-bold text-[#0f5132]">7–14 days</span></div>
                <p className="mt-1 text-xs leading-5 text-slate-500">Price reflects the current landed-cost estimate and markup. Freight and exchange rates can change.</p>
              </div>

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
