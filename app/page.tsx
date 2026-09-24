export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getFeaturedProducts } from '@/lib/storefront/getFeaturedProducts'
import { getAllProducts } from '@/lib/storefront/getAllProducts'
import { getStorefrontCategories } from '@/lib/storefront/getCategories'
import HeroCarousel from '@/components/HeroCarousel'
import ProductCard from '@/components/ProductCard'
import CategoryGrid from '@/components/CategoryGrid'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default async function HomePage() {
  const [featured, catalog, categories, newest] = await Promise.all([
    getFeaturedProducts(8),
    getAllProducts('', '', 'all', 'featured', 18),
    getStorefrontCategories(12),
    getAllProducts('', '', 'all', 'newest', 12),
  ])

  const heroProducts = [...featured, ...catalog.filter((product) => !featured.some((item) => item.sku === product.sku))].slice(0, 5)
  const featuredProducts = [...featured, ...catalog.filter((product) => !featured.some((item) => item.sku === product.sku))].slice(0, 12)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f7f7f3] text-slate-950">
        <section className="mx-auto max-w-[1440px] px-4 pt-5 sm:px-6 lg:pt-7">
          <HeroCarousel slides={heroProducts} />
        </section>

        <div className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-6">
          <CategoryGrid categories={categories} />

          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Featured</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Featured products</h2>
              </div>
              <Link href="/products" className="text-sm font-black text-emerald-800 hover:underline">View all →</Link>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {featuredProducts.map((product) => <ProductCard key={product.sku} product={product} />)}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
                Products will appear here as the catalog fills.
              </div>
            )}
          </section>

          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">New arrivals</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Freshly added products</h2>
              </div>
              <Link href="/products?sort=newest" className="text-sm font-black text-emerald-800 hover:underline">View all →</Link>
            </div>

            {newest.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {newest.slice(0, 12).map((product) => <ProductCard key={product.sku} product={product} />)}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
