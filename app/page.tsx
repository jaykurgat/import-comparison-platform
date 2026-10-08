export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getFeaturedProducts } from '@/lib/storefront/getFeaturedProducts'
import { getAllProducts } from '@/lib/storefront/getAllProducts'
import { getStorefrontCategories } from '@/lib/storefront/getCategories'
import HomepageHero from '@/components/HomepageHero'
import { getHomepageHero } from '@/lib/homepage/hero'
import ProductCard from '@/components/ProductCard'
import CategoryGrid from '@/components/CategoryGrid'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default async function HomePage() {
  const [featured, catalog, categories, newest, hero] = await Promise.all([
    getFeaturedProducts(8),
    getAllProducts('', '', 'all', 'featured', 18),
    getStorefrontCategories(12),
    getAllProducts('', '', 'all', 'newest', 12),
    getHomepageHero(),
  ])

  const featuredProducts = [...featured, ...catalog.filter((product) => !featured.some((item) => item.sku === product.sku))].slice(0, 12)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f6f7f3] text-slate-950">
        <div className="kc-shell pb-12 sm:pb-16">
          <section className="pt-3 sm:pt-5 lg:pt-6">
            <HomepageHero config={hero} />
          </section>

          <CategoryGrid categories={categories} />

          <section className="kc-section">
            <div className="kc-section-heading">
              <div>
                <p className="kc-section-kicker">Featured</p>
                <h2 className="kc-section-title">Featured products</h2>
              </div>
              <Link href="/products" className="shrink-0 text-xs font-black text-[#176043] hover:underline sm:text-sm">View all →</Link>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="kc-product-grid mt-4">
                {featuredProducts.map((product) => <ProductCard key={product.sku} product={product} />)}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                Products will appear here as the catalog fills.
              </div>
            )}
          </section>

          <section className="kc-section">
            <div className="kc-section-heading">
              <div>
                <p className="kc-section-kicker">New arrivals</p>
                <h2 className="kc-section-title">Freshly added products</h2>
              </div>
              <Link href="/products?sort=newest" className="shrink-0 text-xs font-black text-[#176043] hover:underline sm:text-sm">View all →</Link>
            </div>

            {newest.length > 0 && (
              <div className="kc-product-grid mt-4">
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
