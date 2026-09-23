export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getProductPageData } from '@/lib/product/getProductPageData'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import TrackProductView from '@/components/TrackProductView'

export async function generateMetadata({ params }: { params: Promise<{ sku: string }> }): Promise<Metadata> {
  const { sku } = await params
  const data = await getProductPageData(sku)
  if (!data) return { title: 'Product not found | KijijiCart' }
  const description = data.local.description?.slice(0, 155) || `Compare ${data.local.title} locally with available import pricing on KijijiCart.`
  return {
    title: `${data.local.title} | KijijiCart`,
    description,
    alternates: { canonical: `/product/${encodeURIComponent(data.local.sku)}` },
    openGraph: {
      title: data.local.title,
      description,
      type: 'website',
      images: data.local.imageUrls[0] ? [{ url: data.local.imageUrls[0], alt: data.local.title }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params
  const data = await getProductPageData(sku)
  if (!data) notFound()

  const { local, comparison } = data
  const importIsBetter = comparison?.renderMode === 'IMPORT_ADVANTAGE'
  const images = local.imageUrls.length ? local.imageUrls : [null]

  return (
    <>
      <TrackProductView sku={local.sku} title={local.title} price={local.price} currency={local.currency} category={local.categoryName} />
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: local.title,
            description: local.description ?? undefined,
            image: local.imageUrls,
            sku: local.sku,
            category: local.categoryName ?? undefined,
            offers: {
              '@type': 'Offer',
              priceCurrency: local.currency,
              price: local.price,
              availability: local.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/product/${encodeURIComponent(local.sku)}`,
            },
          }),
        }}
      />
      <main className="min-h-screen bg-[#f7f7f3] text-slate-950">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-9">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Link href="/products" className="font-bold text-emerald-800 hover:underline">Products</Link>
            <span>/</span>
            <span className="truncate">{local.title}</span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="grid gap-4 sm:grid-cols-[88px_1fr]">
                <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
                  {images.slice(0, 6).map((src, i) => src ? (
                    <div key={src + i} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-[#f1f2ee] sm:h-20 sm:w-20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ) : null)}
                </div>
                <div className="order-1 aspect-square overflow-hidden rounded-2xl bg-[#f1f2ee] sm:order-2">
                  {images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={images[0]} alt={local.title} className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">Image unavailable</div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">Local listing</span>
                {importIsBetter && <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">Import alternative</span>}
              </div>

              <h1 className="mt-5 text-3xl font-black leading-[1.08] tracking-[-0.035em] sm:text-4xl">{local.title}</h1>

              <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-3xl font-black tabular-nums">{local.currency} {local.price.toLocaleString()}</span>
                <span className={local.inStock ? 'text-sm font-bold text-emerald-700' : 'text-sm font-bold text-slate-500'}>
                  {local.inStock ? 'In stock' : 'Out of stock'}
                </span>
              </div>

              <div className="mt-6 rounded-2xl bg-[#f7f7f3] p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-black">Local availability</span>
                  <span className="text-xs font-bold text-slate-500">{local.inStock ? 'Available now' : 'Currently unavailable'}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">This local listing is the retail reference used by the comparison engine.</p>
              </div>

              {local.description && <p className="mt-6 text-sm leading-7 text-slate-600">{local.description}</p>}
</section>
          </div>

          <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Price comparison</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Local vs. direct import</h2>
              </div>
              {comparison?.isStale && (
                <span className="text-xs font-semibold text-slate-400">Last confirmed {comparison.priceDataAsOf.toLocaleDateString()}</span>
              )}
            </div>

            {!comparison ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-[#f7f7f3] p-7 text-sm leading-6 text-slate-600">
                No verified import alternative is available for this product yet. The local listing remains available while matching data is reviewed.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-6">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Buy locally</p>
                  <p className="mt-3 text-3xl font-black tabular-nums">{local.currency} {comparison.localTotalPrice.toLocaleString()}</p>
                  <p className="mt-2 text-sm text-slate-500">Local retail option</p>
                </div>

                <div className={importIsBetter ? 'rounded-2xl border-2 border-emerald-800 bg-[#f2f8f5] p-6' : 'rounded-2xl border border-slate-200 p-6'}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-800">Direct import</p>
                    {importIsBetter && <span className="rounded-full bg-emerald-800 px-2.5 py-1 text-[10px] font-black text-white">LOWER ESTIMATED COST</span>}
                  </div>
                  <p className="mt-3 text-3xl font-black tabular-nums">{local.currency} {comparison.sellPrice.toLocaleString()}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Landed-cost estimate plus marketplace markup. Supplier freight and exchange rates can change.</p>
                  {comparison.remote.orderable ? (
                    <Link
                      href={`/import/${encodeURIComponent(comparison.remote.productId)}/${encodeURIComponent(comparison.remote.skuId)}`}
                      className="mt-5 inline-flex rounded-xl bg-[#123f2b] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0d3021]"
                    >
                      Buy this import from KijijiCart →
                    </Link>
                  ) : (
                    <p className="mt-5 text-sm text-slate-500">
                      This import option is not currently available to buy through KijijiCart.
                    </p>
                  )}
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
