import { getAllProducts } from '@/lib/storefront/getAllProducts'
import ProductCard from '@/components/ProductCard'

export default async function ProductsPage() {
  const products = await getAllProducts()

  return (
    <main className="min-h-screen bg-white text-[#14141A]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold">All Products</h1>
        <p className="mt-1 text-sm text-[#6B6B76]">
          {products.length} product{products.length === 1 ? '' : 's'}
        </p>

        {products.length === 0 ? (
          <div className="mt-10 rounded-lg border border-[#EDEDEC] bg-[#FAFAF9] px-6 py-10 text-center text-sm text-[#6B6B76]">
            No products yet.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.sku} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
