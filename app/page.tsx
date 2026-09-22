import Link from 'next/link'
import { getFeaturedProducts } from '@/lib/storefront/getFeaturedProducts'
import HeroCarousel from '@/components/HeroCarousel'
import ProductCard from '@/components/ProductCard'

export default async function HomePage() {
  const featured = await getFeaturedProducts(8)

  return (
    <main className="min-h-screen bg-white text-[#14141A]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <HeroCarousel slides={featured.slice(0, 5)} />

        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Featured deals</h2>
            <Link href="/products" className="text-sm font-medium text-[#1B5E4A] underline">
              View all products
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="mt-4 text-sm text-[#6B6B76]">
              No featured deals right now — check back soon, or{' '}
              <Link href="/products" className="underline">
                browse all products
              </Link>
              .
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.sku} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
