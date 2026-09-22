import Link from 'next/link'
import { getAllProducts } from '@/lib/storefront/getAllProducts'
import ProductCard from '@/components/ProductCard'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default async function ProductsPage() {
  const products = await getAllProducts()
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f5f6f7]">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
          <div className="mb-5 rounded-xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wider text-[#0f5132]">Marketplace</p><h1 className="mt-1 text-2xl font-black text-slate-950">All Products</h1><p className="mt-1 text-sm text-slate-500">{products.length} product{products.length === 1 ? '' : 's'}</p></div>
              <Link href="/" className="text-sm font-bold text-[#0f5132]">← Home</Link>
            </div>
          </div>
          {products.length === 0 ? <div className="rounded-xl bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">No products yet.</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{products.map((product) => <ProductCard key={product.sku} product={product} />)}</div>}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
