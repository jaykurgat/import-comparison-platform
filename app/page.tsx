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
    getFeaturedProducts(8),
    getStorefrontCategories(12),
  ])

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f7f7f3] text-slate-950">
        <section className="mx-auto max-w-[1440px] px-4 pt-5 sm:px-6 lg:pt-7">
          <HeroCarousel slides={featured.slice(0, 5)} />
        </section>

        <div className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-6">
          <section className="mt-4 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-3">
            {[
              ['01', 'Compare with confidence', 'See the local retail reference alongside a verified import alternative when one is available.'],
              ['02', 'See the real cost', 'Import comparisons use the supplier price, freight, exchange rate and available cost inputs.'],
              ['03', 'Choose how to buy', 'Keep the local option or continue into the import flow when a supplier listing is available.'],
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

          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Curated for you</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Featured products</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Products are selected from the live catalog. Comparison data enriches a listing but does not remove a valid local product.
                </p>
              </div>
              <Link href="/products" className="hidden shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:text-[#123f2b] sm:inline-flex">View all products →</Link>
            </div>

            {featured.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
                Featured products will appear here once the catalog has publishable inventory.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {featured.map((product) => <ProductCard key={product.sku} product={product} />)}
              </div>
            )}
          </section>

          <section className="mt-12 overflow-hidden rounded-[2rem] bg-[#123f2b]">
            <div className="grid gap-8 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:px-14">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">The KijijiCart difference</p>
                <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Know what you are paying before you decide where to buy.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/80">
                  Local listings stay visible as the foundation of the marketplace. When a trustworthy import comparison exists, we surface it beside the local option so the decision is transparent.
                </p>
                <Link href="/products" className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-[#123f2b] transition hover:bg-emerald-50">
                  Explore the catalog →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Local', 'Retail reference'],
                  ['Import', 'Supplier alternative'],
                  ['Freight', 'Destination-aware'],
                  ['Price', 'Current persisted value'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-200">{label}</div>
                    <div className="mt-2 text-sm font-bold text-white">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-6 sm:hidden">
            <Link href="/products" className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">View all products →</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
