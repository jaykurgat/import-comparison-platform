export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getImportProductGroupPageData } from '@/lib/product/getImportProductGroupPageData'
import { getComparableLocalsForImportProduct, getRelatedProductsForImport } from '@/lib/storefront/getProductRelations'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ImportVariantGallery from '@/components/ImportVariantGallery'
import { ImportVariantProvider } from '@/components/ImportVariantContext'
import ProductDescription from '@/components/ProductDescription'
import ImportVariantSelector from '@/components/ImportVariantSelector'
import { ComparableProductsRail, RelatedProductsRail } from '@/components/ProductRecommendationRails'

export async function generateMetadata({ params }: { params: Promise<{ productId: string }> }): Promise<Metadata> {
  const { productId } = await params
  const data = await getImportProductGroupPageData(productId)
  if (!data) return { title: 'Import product not found | KijijiCart' }

  const description = data.description.slice(0, 155)

  return {
    title: data.title + ' | KijijiCart Import',
    description,
    alternates: { canonical: '/import/' + encodeURIComponent(productId) },
    openGraph: {
      title: data.title,
      description,
      type: 'website',
      images: data.imageUrls[0] ? [{ url: data.imageUrls[0], alt: data.title }] : undefined,
    },
  }
}

export default async function ImportProductGroupPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  const data = await getImportProductGroupPageData(productId)
  if (!data) notFound()

  const prices = data.variants.map((variant) => variant.sellPrice)
  const lowPrice = Math.min(...prices)
  const highPrice = Math.max(...prices)
  const hasStock = data.variants.some((variant) => variant.availableStock > 0)
  const currency = data.variants[0]?.currency ?? 'KES'

  const [comparableLocals, relatedProducts] = await Promise.all([
    getComparableLocalsForImportProduct(productId, 4),
    getRelatedProductsForImport(productId, data.categoryKey, data.title, null, null, null, 6),
  ])

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
            sku: data.productId,
            category: data.categoryName ?? undefined,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: currency,
              lowPrice,
              highPrice,
              offerCount: data.variants.length,
              availability: hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              url: (process.env.NEXT_PUBLIC_APP_URL ?? '') + '/import/' + encodeURIComponent(productId),
            },
          }),
        }}
      />

      <main className="min-h-screen bg-[#f7f7f3] text-slate-950">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-9">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Link href="/products" className="font-bold text-emerald-800 hover:underline">Products</Link>
            <span>/</span>
            {data.categoryPath.length > 0 ? data.categoryPath.map((category, index) => (
              <span key={category + index} className={index === data.categoryPath.length - 1 ? 'font-semibold text-slate-700' : ''}>
                {index > 0 && <span className="mr-2">/</span>}
                {category}
              </span>
            )) : <span>Direct import</span>}
            <span>/</span>
            <span className="truncate">{data.title}</span>
          </div>

          <ImportVariantProvider variants={data.variants}>
            <div className="grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <ImportVariantGallery title={data.title} fallbackImages={data.imageUrls} />
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                  <span className="rounded-full bg-[#eef7f2] px-3 py-1.5 text-emerald-800">Direct import</span>
                  {data.categoryName && (
                    <Link
                      href={data.categoryKey ? `/products?category=${encodeURIComponent(data.categoryKey)}` : '/products'}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600 hover:bg-slate-200"
                    >
                      {data.categoryName}
                    </Link>
                  )}
                </div>

                <h1 className="mt-5 text-3xl font-black leading-[1.08] tracking-[-0.035em] sm:text-4xl">{data.title}</h1>
                <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-2">
                  <div className="text-3xl font-black tracking-tight tabular-nums">{currency} {lowPrice.toLocaleString()}</div>
                  {highPrice !== lowPrice && <div className="text-sm font-bold text-slate-400">to {currency} {highPrice.toLocaleString()}</div>}
                </div>
                <p className="mt-2 text-sm text-slate-500">Price varies by selected supplier variant.</p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#f7f7f3] p-4">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Variants</div>
                    <div className="mt-2 text-sm font-bold text-slate-800">{data.variants.length}</div>
                  </div>
                  <div className="rounded-2xl bg-[#f7f7f3] p-4">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Availability</div>
                    <div className="mt-2 text-sm font-bold text-emerald-800">{hasStock ? 'Some variants available' : 'Currently unavailable'}</div>
                  </div>
                </div>

                <ImportVariantSelector productId={data.productId} title={data.title} />

                <ProductDescription description={data.description} coreFeatures={data.coreFeatures} />

                <a href={data.aliExpressUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:border-slate-300">View supplier listing →</a>
              </section>
            </div>
          </ImportVariantProvider>

          <ComparableProductsRail products={comparableLocals} importSide />
          <RelatedProductsRail products={relatedProducts} />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
