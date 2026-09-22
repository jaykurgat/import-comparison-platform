import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProductPageData } from '@/lib/product/getProductPageData'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default async function ProductPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params
  const data = await getProductPageData(sku)
  if (!data) notFound()

  const { local, comparison } = data
  const importIsBetter = comparison?.renderMode === 'IMPORT_ADVANTAGE'
  const images = local.imageUrls.length ? local.imageUrls : [null]

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f5f6f7] text-slate-950">
        <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:py-8">
          <div className="mb-4 text-xs text-slate-500">
            <Link href="/products" className="font-semibold hover:text-[#0f5132]">Products</Link>
            <span className="mx-1">/</span>{local.title}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
            <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <div className="grid gap-3 sm:grid-cols-[84px_1fr]">
                <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
                  {images.slice(0, 6).map((src, i) => src ? (
                    <div key={src + i} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 sm:h-20 sm:w-20">
                      <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ) : null)}
                </div>
                <div className="order-1 aspect-square overflow-hidden rounded-xl bg-slate-50 sm:order-2">
                  {images[0] ? <img src={images[0]} alt={local.title} className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">No image available</div>}
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">Local product</span>
                {importIsBetter && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">Import alternative</span>}
              </div>
              <h1 className="mt-4 text-2xl font-black leading-tight sm:text-3xl">{local.title}</h1>
              <div className="mt-5 text-3xl font-black tabular-nums">{local.currency} {local.price.toLocaleString()}</div>
              <div className="mt-2 text-sm text-slate-500">{local.color ?? 'Standard'}{local.size ? ' · ' + local.size : ''}</div>

              <div className="mt-6 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between"><span className="text-sm font-bold">Local availability</span><span className="text-xs font-bold text-[#0f5132]">Available</span></div>
                <p className="mt-1 text-xs leading-5 text-slate-500">This listing is the local retail reference used for the comparison.</p>
              </div>
              {local.description && <p className="mt-6 text-sm leading-6 text-slate-600">{local.description}</p>}
            </section>
          </div>

          <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#0f5132]">Price comparison</p>
                <h2 className="mt-1 text-2xl font-black">Local vs. direct import</h2>
              </div>
              {comparison?.isStale && <span className="text-xs text-slate-400">Last confirmed {comparison.priceDataAsOf.toLocaleDateString()}</span>}
            </div>

            {!comparison ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">No verified import alternative is available for this product yet.</div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Buy locally</p>
                  <p className="mt-2 text-2xl font-black tabular-nums">{local.currency} {comparison.localTotalPrice.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-slate-500">Local retail option</p>
                </div>
                <div className={importIsBetter ? 'rounded-xl border-2 border-[#0f5132] bg-[#f2f8f5] p-5' : 'rounded-xl border border-slate-200 p-5'}>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#0f5132]">Direct import</p>
                  <p className="mt-2 text-2xl font-black tabular-nums">{local.currency} {comparison.sellPrice.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-slate-500">Landed cost + marketplace markup · estimated 7–14 days</p>
                  <a href={comparison.remote.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-lg bg-[#0f5132] px-4 py-2 text-sm font-bold text-white hover:bg-[#0b4128]">View import option →</a>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
