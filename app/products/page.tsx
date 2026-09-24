export const dynamic = 'force-dynamic'

import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllProducts, type CatalogSort } from '@/lib/storefront/getAllProducts'
import { getStorefrontCategories } from '@/lib/storefront/getCategories'
import ProductCard from '@/components/ProductCard'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import SearchTracker from '@/components/SearchTracker'
import CatalogControls from '@/components/CatalogControls'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}): Promise<Metadata> {
  const params = await searchParams
  const query = params.q?.trim()
  const category = params.category?.trim()

  return {
    title: query ? 'Search: ' + query + ' | KijijiCart' : category ? 'Category products | KijijiCart' : 'Shop all products | KijijiCart',
    description: query
      ? 'Browse KijijiCart products matching ' + query + '.'
      : 'Browse the KijijiCart product catalogue.',
    alternates: { canonical: '/products' },
  }
}

function normalizeSort(value: string | undefined): CatalogSort {
  return value === 'newest' || value === 'price_asc' || value === 'price_desc' || value === 'name'
    ? value
    : 'featured'
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>
}) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const categoryId = params.category?.trim() ?? ''
  const sort = normalizeSort(params.sort)

  const [products, categories] = await Promise.all([
    getAllProducts(query, categoryId, 'all', sort),
    getStorefrontCategories(12),
  ])
  const selectedCategory = categories.find((category) => category.id === categoryId)

  return (
    <>
      <SearchTracker query={query} />
      <SiteHeader />
      <main className="min-h-screen bg-[#f7f7f3]">
        <div className="mx-auto max-w-[1600px] px-3 py-5 sm:px-5 lg:py-7">
          <section className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="bg-[#123f2b] px-5 py-7 text-white sm:px-8 sm:py-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">KijijiCart marketplace</p>
                  <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                    {selectedCategory?.name ?? (query ? 'Search results' : 'All products')}
                  </h1>
                  <p className="mt-2 text-sm text-emerald-50/75">
                    {products.length} product{products.length === 1 ? '' : 's'}{query ? ' matching “' + query + '”' : ''}.
                  </p>
                </div>
                <Link href="/" className="text-sm font-bold text-white/80 hover:text-white">← Home</Link>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              {categories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  <Link
                    href={{ pathname: '/products', query: { ...(query ? { q: query } : {}), ...(sort !== 'featured' ? { sort } : {}) } }}
                    className={'whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-bold ' + (!categoryId ? 'bg-[#0f5132] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
                  >
                    All categories
                  </Link>

                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={{ pathname: '/products', query: { ...(query ? { q: query } : {}), category: category.id, ...(sort !== 'featured' ? { sort } : {}) } }}
                      className={'whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ' + (category.id === categoryId ? 'bg-[#0f5132] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
                    >
                      {category.name}
                      <span className="ml-1 text-[10px] opacity-60">{category.productCount}</span>
                    </Link>
                  ))}
                </div>
              )}

              <CatalogControls query={query} categoryId={categoryId} sort={sort} />
            </div>
          </section>

          {products.length === 0 ? (
            <div className="mt-5 rounded-sm border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm bg-[#eef7f2] text-xl text-[#123f2b]">⌕</div>
              <p className="mt-4 font-bold text-slate-900">No products found</p>
              <p className="mt-2 text-sm text-slate-500">
                {query || categoryId ? 'Try a different search or category.' : 'Products will appear here once they are published.'}
              </p>
              {(query || categoryId) && (
                <Link href="/products" className="mt-5 inline-flex rounded-sm bg-[#0f5132] px-5 py-2.5 text-sm font-bold text-white">Clear filters</Link>
              )}
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => <ProductCard key={product.sku} product={product} />)}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
