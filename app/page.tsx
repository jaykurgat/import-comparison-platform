export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getFeaturedProducts } from '@/lib/storefront/getFeaturedProducts'
import { getStorefrontCategories } from '@/lib/storefront/getCategories'
import HeroCarousel from '@/components/HeroCarousel'
import ProductCard from '@/components/ProductCard'
import CategoryGrid from '@/components/CategoryGrid'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(12),
    getStorefrontCategories(12),
  ])
  const deals = featured.filter((product) => product.hasDeal).slice(0, 6)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f7f7f3] text-slate-950">
        <section className="mx-auto max-w-[1440px] px-4 pt-5 sm:px-6 lg:pt-7">
          <HeroCarousel slides={featured.slice(0, 5)} />
        </section>

        <div className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-6">
          <section className="mt-4 grid overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-3">
            {[
              ['01', 'Compare with confidence', 'Local products stay visible while verified import data is treated as enrichment.'],
              ['02', 'See the real cost', 'Where available, comparisons use persisted supplier price, freight, FX and landed-cost inputs.'],
              ['03', 'Choose how to buy', 'Keep the local option or continue into a direct-import checkout when a listing is published and in stock.'],
            ].map(([number, title, body]) => (
              <div key={number} className={`p-5 sm:p-6 ${number !== '01' ? 'border-t border-slate-100 sm:border-l sm:border-t-0' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black tracking-[0.18em] text-emerald-700">{number}</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                <h2 className="mt-5 text-base font-black">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
              </div>
            ))}
          </section>

          <CategoryGrid categories={categories} />

          {deals.length > 0 && (
            <section className="mt-12 overflow-hidden rounded-[2rem] border border-emerald-100 bg-[#f2f8f5]">
              <div className="flex flex-col gap-4 px-6 py-7 sm:flex-row sm:items-end sm:justify-between sm:px-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Verified comparisons</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Import alternatives worth a look</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">These cards have a persisted comparison result showing a lower estimated import selling price than the local reference.</p>
                </div>
                <Link href="/products?source=deals" className="shrink-0 text-sm font-black text-[#123f2b] hover:underline">See all comparisons →</Link>
              </div>
              <div className="grid grid-cols-2 gap-3 px-5 pb-6 sm:grid-cols-3 sm:px-8 lg:grid-cols-6">
                {deals.map((product) => <ProductCard key={product.sku} product={product} />)}
              </div>
            </section>
          )}

          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Live catalog</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Featured products</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Real catalog products, not placeholders. Matching can enrich a listing without deciding whether it belongs in the store.</p>
              </div>
              <Link href="/products" className="hidden shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:text-[#123f2b] sm:inline-flex">View all products →</Link>
            </div>

            {featured.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
                Featured products will appear here once the live catalog has publishable inventory.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {featured.map((product) => <ProductCard key={product.sku} product={product} />)}
              </div>
            )}
          </section>

          <section className="mt-12 overflow-hidden rounded-[2rem] bg-[#123f2b]">
            <div className="grid gap-8 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-14">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">The KijijiCart approach</p>
                <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">One catalog. Clearer buying decisions.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/80">A local listing does not disappear because matching is incomplete. When supplier data is good enough to compare, we surface it alongside the local reference instead of hiding the underlying catalog.</p>
                <Link href="/products" className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-[#123f2b] transition hover:bg-emerald-50">Explore the catalog →</Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Local', 'Retail reference'],
                  ['Import', 'Supplier alternative'],
                  ['Freight', 'Destination-aware input'],
                  ['Price', 'Persisted current value'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-200">{label}</div>
                    <div className="mt-2 text-sm font-bold text-white">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ['Live catalog', 'Products come from persisted catalog data.'],
              ['Transparent comparison', 'Import numbers remain tied to their stored pricing data.'],
              ['Secure checkout boundary', 'Supplier submission waits for confirmed customer payment.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-black">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
