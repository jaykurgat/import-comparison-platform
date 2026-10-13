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
    <section className="kc-recommendation-rail mt-5 rounded-xl border border-[#E3E7E0] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#55785A]">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#203B29] sm:text-xl">{title}</h2>
          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#737D73]">{description}</p>
        </div>
        <Link href="/products" className="text-xs font-semibold text-[#315D40] hover:underline">Browse all →</Link>
      </div>

      <div className="kc-product-grid mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
      description="Products from this category and closely related categories, ranked by product title and attributes."
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
