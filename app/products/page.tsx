export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getAllProducts } from '@/lib/storefront/getAllProducts'
import { getStorefrontCategories } from '@/lib/storefront/getCategories'
import ProductCard from '@/components/ProductCard'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const categoryId = params.category?.trim() ?? ''
  const [products, categories] = await Promise.all([
    getAllProducts(query, categoryId),
    getStorefrontCategories(12),
  ])
  const selectedCategory = categories.find((category) => category.id === categoryId)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f7f7f3]">
        <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:py-9">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Marketplace</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  {selectedCategory?.name ?? (query ? 'Search results' : 'All products')}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {products.length} product{products.length === 1 ? '' : 's'}
                  {query ? ` matching "${query}"` : ''}
                </p>
              </div>
              <Link href="/" className="text-sm font-bold text-emerald-800 hover:underline">← Home</Link>
            </div>

            {categories.length > 0 && (
              <div className="mt-6 flex gap-2 overflow-x-auto border-t border-slate-100 pt-5">
                <Link
                  href={{ pathname: '/products', query: query ? { q: query } : {} }}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${!categoryId ? 'bg-[#0f5132] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  All
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={{ pathname: '/products', query: { ...(query ? { q: query } : {}), category: category.id } }}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${category.id === categoryId ? 'bg-[#0f5132] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {products.length === 0 ? (
            <div className="mt-5 rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
              <p className="font-bold text-slate-900">No products found</p>
              <p className="mt-2 text-sm text-slate-500">
                {query || categoryId
                  ? 'Try another search or browse the full catalogue.'
                  : 'Products will appear here once they are published.'}
              </p>
              {(query || categoryId) && (
                <Link href="/products" className="mt-5 inline-flex rounded-xl bg-[#0f5132] px-5 py-2.5 text-sm font-bold text-white">
                  Browse all products
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {products.map((product) => <ProductCard key={product.sku} product={product} />)}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
