export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getImportProductPageData } from '@/lib/product/getImportProductPageData'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ProductGallery from '@/components/ProductGallery'
import ProductDescription from '@/components/ProductDescription'
import AddToCartActions from '@/components/cart/AddToCartActions'

export async function generateMetadata({ params }: { params: Promise<{ productId: string; skuId: string }> }): Promise<Metadata> {
  const { productId, skuId } = await params
  const data = await getImportProductPageData(productId, skuId)
  if (!data) return { title: 'Import product not found | KijijiCart' }
  const description = data.description.slice(0, 155)
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: data.title,
            description: data.description || undefined,
            image: data.imageUrls,
            sku: data.skuId,
            category: data.categoryName ?? undefined,
            offers: {
              '@type': 'Offer',
              priceCurrency: data.currency,
              price: data.sellPrice,
              availability: 'https://schema.org/InStock',
              url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/import/${encodeURIComponent(data.productId)}/${encodeURIComponent(data.skuId)}`,
            },
          }),
        }}
      />

      <main className="min-h-screen bg-[#f7f7f3] text-slate-950">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-9">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Link href="/products" className="font-bold text-emerald-800 hover:underline">Products</Link>
            <span>/</span>
            <span className="truncate">Supplier product</span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <ProductGallery title={data.title} imageUrls={data.imageUrls} />
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                <span className="rounded-full bg-[#eef7f2] px-3 py-1.5 text-emerald-800">Supplier product</span>
                {data.categoryName && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{data.categoryName}</span>}
              </div>

              <h1 className="mt-5 text-3xl font-black leading-[1.08] tracking-[-0.035em] sm:text-4xl">{data.title}</h1>
              <div className="mt-6 text-3xl font-black tracking-tight tabular-nums">{data.currency} {data.sellPrice.toLocaleString()}</div>
              <p className="mt-2 text-sm text-slate-500">Current supplier price based on landed cost and marketplace pricing.</p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f7f7f3] p-4">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Stock</div>
                  <div className="mt-2 text-sm font-bold text-emerald-800">{data.availableStock} available</div>
                </div>
                <div className="rounded-2xl bg-[#f7f7f3] p-4">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ships from</div>
                  <div className="mt-2 text-sm font-bold text-slate-700">{data.shipFromCountry ?? 'Supplier listing'}</div>
                </div>
              </div>

              {(data.color || data.size) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {data.color && <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">Color: {data.color}</span>}
                  {data.size && <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">Size: {data.size}</span>}
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-emerald-100 bg-[#f2f8f5] p-4">
                <div className="text-sm font-black text-[#123f2b]">Import fulfillment</div>
                <p className="mt-1 text-xs leading-5 text-slate-600">Payment is collected in KES through M-PESA. Supplier order submission happens only after successful payment confirmation.</p>
              </div>

              <AddToCartActions
                item={{
                  key: 'supplier:' + data.productId + ':' + data.skuId,
                  kind: 'supplier',
                  title: data.title,
                  imageUrl: data.imageUrls[0] ?? null,
                  price: data.sellPrice,
                  currency: data.currency,
                  quantity: 1,
                  availableStock: data.availableStock,
                  sku: data.skuId,
                  productId: data.productId,
                  skuId: data.skuId,
                  options: {
                    ...(data.color ? { Color: data.color } : {}),
                    ...(data.size ? { Size: data.size } : {}),
                  },
                }}
              />

              <a href={data.aliExpressUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:border-slate-300">View supplier listing →</a>

              <ProductDescription description={data.description} coreFeatures={data.coreFeatures} />
              {data.isStale && <p className="mt-5 text-xs text-amber-700">Price last confirmed {data.priceDataAsOf.toLocaleDateString()} and may have changed.</p>}
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
