import Link from 'next/link'
import { getFeaturedProducts } from '@/lib/storefront/getFeaturedProducts'
import HeroCarousel from '@/components/HeroCarousel'
import ProductCard from '@/components/ProductCard'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default async function HomePage() {
  const featured = await getFeaturedProducts(8)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f5f6f7] text-slate-900">
        <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <aside className="hidden rounded-xl bg-white p-4 shadow-sm lg:block">
              <div className="mb-3 text-sm font-bold text-slate-900">Shop by category</div>
              <div className="space-y-1">
                {['Electronics','Phones & Tablets','Home & Kitchen','Beauty','Fashion','Health','Office & School','Automotive','Sports'].map((item) => (
                  <Link key={item} href="/products" className="block rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#0f5132]">{item}</Link>
                ))}
              </div>
            </aside>
            <HeroCarousel slides={featured.slice(0, 5)} />
          </div>

          <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-end justify-between">
              <div><p className="text-xs font-bold uppercase tracking-wider text-[#0f5132]">Shop smarter</p><h2 className="mt-1 text-2xl font-extrabold">Featured deals</h2></div>
              <Link href="/products" className="text-sm font-bold text-[#0f5132] hover:underline">View all →</Link>
            </div>
            {featured.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">No featured deals right now — check back soon.</p>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {featured.map((product) => <ProductCard key={product.sku} product={product} />)}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
