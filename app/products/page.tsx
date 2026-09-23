export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getAllProducts } from '@/lib/storefront/getAllProducts'
import ProductCard from '@/components/ProductCard'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const products = await getAllProducts(query)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f5f6f7]">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
          <div className="mb-5 rounded-xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#0f5132]">Marketplace</p>
                <h1 className="mt-1 text-2xl font-black text-slate-950">{query ? 'Search results' : 'All Products'}</h1>
                <p className="mt-1 text-sm text-slate-500">{products.length} product{products.length === 1 ? '' : 's'}{query ? ' matching "' + query + '"' : ''}</p>
              </div>
              <Link href="/" className="text-sm font-bold text-[#0f5132]">← Home</Link>
            </div>
          </div>
          {products.length === 0 ? (
            <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm">
              <p className="font-bold text-slate-800">No products found</p>
              <p className="mt-1 text-sm text-slate-500">{query ? 'Try a broader product name or browse the full catalogue.' : 'Products will appear here once they are published.'}</p>
              {query && <Link href="/products" className="mt-5 inline-flex rounded-lg bg-[#0f5132] px-4 py-2 text-sm font-bold text-white">Browse all products</Link>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {products.map((product) => <ProductCard key={product.sku} product={product} />)}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
