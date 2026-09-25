export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getProductPageData } from '@/lib/product/getProductPageData'
import { getComparableImportsForLocal, getRelatedProductsForLocal } from '@/lib/storefront/getProductRelations'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import TrackProductView from '@/components/TrackProductView'
import ProductGallery from '@/components/ProductGallery'
import ProductDescription from '@/components/ProductDescription'
import AddToCartActions from '@/components/cart/AddToCartActions'
import { ComparableProductsRail, RelatedProductsRail } from '@/components/ProductRecommendationRails'

export async function generateMetadata({ params }: { params: Promise<{ sku: string }> }): Promise<Metadata> {
  const { sku } = await params
  const data = await getProductPageData(sku)
  if (!data) return { title: 'Product not found | KijijiCart' }
  const description = data.local.description.slice(0, 155)
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

  const [comparableImports, relatedProducts] = await Promise.all([
    getComparableImportsForLocal(local.id, 4),
    getRelatedProductsForLocal(local.sku, local.categoryId, local.title, local.color, local.size, local.specs, 6),
  ])

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
          <div className="sticky top-[215px] z-30 -mx-4 mb-5 border-b border-slate-200 bg-[#f7f7f3]/95 px-4 py-3 text-xs text-slate-500 backdrop-blur sm:-mx-6 sm:px-6 md:top-[145px]">
            <Link href="/products" className="font-bold text-emerald-800 hover:underline">Products</Link>
            {local.categoryName && (
              <>
                <span>/</span>
                <Link href={`/products?category=${encodeURIComponent(data.local.categoryId ? 'local:' + data.local.categoryId : '')}`} className="font-semibold hover:text-emerald-800">{local.categoryName}</Link>
              </>
            )}
            <span>/</span>
            <span className="truncate">{local.title}</span>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_.8fr] xl:grid-cols-[1.25fr_.75fr]">
            <section className="min-w-0 lg:sticky lg:top-[190px] lg:h-[calc(100vh-205px)] lg:self-start lg:overflow-y-auto lg:overscroll-contain">
              <ProductGallery title={local.title} imageUrls={local.imageUrls} />
            </section>

            <section className="min-w-0 bg-white p-5 shadow-sm sm:p-7 lg:rounded-sm">
              <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">Local listing</span>
                {local.categoryName && <span className="rounded-full bg-[#eef7f2] px-3 py-1.5 text-emerald-800">{local.categoryName}</span>}
                {comparison && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">Supplier option available</span>}
              </div>

              <h1 className="mt-5 text-3xl font-black leading-[1.08] tracking-[-0.035em] sm:text-4xl">{local.title}</h1>

              <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-3xl font-black tabular-nums">{local.currency} {local.price.toLocaleString()}</span>
                <span className={local.inStock ? 'text-sm font-bold text-emerald-700' : 'text-sm font-bold text-slate-500'}>
                  {local.inStock ? 'In stock' : 'Currently unavailable'}
                </span>
              </div>

              {(local.color || local.size) && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {local.color && <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">Color: {local.color}</span>}
                  {local.size && <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">Size: {local.size}</span>}
                </div>
              )}

              <div className="mt-6 rounded-2xl bg-[#f7f7f3] p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-black">Local availability</span>
                  <span className="text-xs font-bold text-slate-500">{local.inStock ? 'Available now' : 'Currently unavailable'}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">This local listing remains part of the catalog independently of comparison status.</p>
              </div>

              <AddToCartActions
                item={{
                  key: 'local:' + local.sku,
                  kind: 'local',
                  title: local.title,
                  imageUrl: local.imageUrls[0] ?? null,
                  price: local.price,
                  currency: local.currency,
                  quantity: 1,
                  availableStock: local.inStock ? 20 : 0,
                  sku: local.sku,
                  options: {
                    ...(local.color ? { Color: local.color } : {}),
                    ...(local.size ? { Size: local.size } : {}),
                  },
                }}
              />

              <ProductDescription description={local.description} coreFeatures={local.coreFeatures} />

              {local.sourceUrl && (
                <a href={local.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex text-sm font-bold text-emerald-800 hover:underline">
                  View original local listing →
                </a>
              )}
            </section>
          </div>

          <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">More ways to shop</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Other ways to get this product</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">We keep supplier pricing and availability in the background and surface a matching option here when one is verified.</p>
              </div>
              {comparison?.isStale && <span className="text-xs font-semibold text-slate-400">Last confirmed {comparison.priceDataAsOf.toLocaleDateString()}</span>}
            </div>

            {!comparison ? (
              <div className="mt-6 grid gap-4 rounded-2xl border border-dashed border-slate-300 bg-[#f7f7f3] p-6 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-black text-slate-900">No matching supplier option yet</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">The local product remains available while supplier data is being matched and refreshed.</p>
                </div>
                <span className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-500">Available in the catalogue</span>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-6">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Buy locally</p>
                  <p className="mt-3 text-3xl font-black tabular-nums">{local.currency} {comparison.localTotalPrice.toLocaleString()}</p>
                  <p className="mt-2 text-sm text-slate-500">Current local price</p>
                </div>

                <div className={importIsBetter ? 'rounded-2xl border-2 border-[#123f2b] bg-[#f2f8f5] p-6' : 'rounded-2xl border border-slate-200 p-6'}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-800">Supplier option</p>
                    {importIsBetter && <span className="rounded-full bg-[#123f2b] px-2.5 py-1 text-[10px] font-black text-white">CURRENT SUPPLIER OPTION</span>}
                  </div>
                  <p className="mt-3 text-3xl font-black tabular-nums">{local.currency} {comparison.sellPrice.toLocaleString()}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Current supplier price based on landed cost and marketplace pricing. Freight and exchange rates can change.</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a href={comparison.remote.url} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300">
                      View supplier listing →
                    </a>
                    {comparison.remote.isPublished && comparison.remote.availableStock > 0 && (
                      <Link href={`/import/${encodeURIComponent(comparison.remote.productId)}/${encodeURIComponent(comparison.remote.skuId)}`} className="inline-flex rounded-xl bg-[#123f2b] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0d3021]">
                        Shop this option →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <ComparableProductsRail products={comparableImports} />
          <RelatedProductsRail products={relatedProducts} />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
