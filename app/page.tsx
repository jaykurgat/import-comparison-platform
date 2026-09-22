import Link from 'next/link'
import { getFeaturedProducts } from '@/lib/storefront/getFeaturedProducts'
import HeroCarousel from '@/components/HeroCarousel'
import ProductCard from '@/components/ProductCard'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

const categories = ['Electronics', 'Phones & Tablets', 'Home & Kitchen', 'Beauty', 'Fashion', 'Health', 'Office & School', 'Automotive', 'Sports']

export default async function HomePage() {
  const featured = await getFeaturedProducts(8)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f5f6f7] text-slate-900">
        <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <aside className="hidden rounded-xl bg-white p-4 shadow-sm lg:block">
              <div className="mb-3 text-sm font-bold">Shop by category</div>
              <div className="space-y-1">
                {categories.map((item) => (
                  <Link key={item} href="/products" className="block rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#0f5132]">{item}</Link>
                ))}
              </div>
            </aside>
            <HeroCarousel slides={featured.slice(0, 5)} />
          </div>

          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ['Compare prices', 'See the local retail price beside a verified import alternative.'],
              ['Understand landed cost', 'Import comparisons use product price, freight, exchange rates and applicable cost inputs.'],
              ['Buy from the source', 'When an import option is available, continue to the supplier listing to complete the purchase.'],
            ].map(([title, body], i) => (
              <div key={title} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7f3ee] text-sm font-black text-[#0f5132]">{i + 1}</div>
                <h2 className="mt-4 font-bold">{title}</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">{body}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 rounded-xl bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-wider text-[#0f5132]">Shop smarter</p><h2 className="mt-1 text-2xl font-extrabold">Featured deals</h2><p className="mt-1 text-sm text-slate-500">Products with a verified comparison and an available import advantage.</p></div>
              <Link href="/products" className="shrink-0 text-sm font-bold text-[#0f5132] hover:underline">View all →</Link>
            </div>
            {featured.length === 0 ? (
              <div className="mt-6 rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">No featured deals right now — check back soon.</div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {featured.map((product) => <ProductCard key={product.sku} product={product} />)}
              </div>
            )}
          </section>

          <section className="mt-6 rounded-xl bg-[#0f5132] p-6 text-white sm:p-8">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Local vs. import</p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">Know the price before you choose where to buy.</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-50">The platform is designed to separate local retail pricing from the estimated cost of importing the same or matched product, rather than presenting an import sticker price alone.</p>
              <Link href="/products" className="mt-5 inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#0f5132]">Explore products →</Link>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
