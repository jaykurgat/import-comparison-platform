import Link from 'next/link'
import ProductCard from './ProductCard'
import type { ProductTeaser } from '@/lib/storefront/productTeaser'

function Rail({
  title,
  eyebrow,
  description,
  products,
}: {
  title: string
  eyebrow: string
  description: string
  products: ProductTeaser[]
}) {
  if (products.length === 0) return null

  return (
    <section className="mt-6 rounded-sm border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <Link href="/products" className="text-sm font-bold text-emerald-800 hover:underline">Browse all →</Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.sku + product.href} product={product} />
        ))}
      </div>
    </section>
  )
}

export function RelatedProductsRail({ products }: { products: ProductTeaser[] }) {
  return (
    <Rail
      eyebrow="Related"
      title="You may also like"
      description="Products from the same canonical category, ordered using product and attribute similarity."
      products={products}
    />
  )
}

export function ComparableProductsRail({
  products,
  importSide = false,
}: {
  products: ProductTeaser[]
  importSide?: boolean
}) {
  return (
    <Rail
      eyebrow="More to explore"
      title={importSide ? 'Available locally' : 'Other ways to shop'}
      description={
        importSide
          ? 'A matching local product is available in the KijijiCart catalogue.'
          : 'A matching supplier product is available if you want another way to get this item.'
      }
      products={products}
    />
  )
}
