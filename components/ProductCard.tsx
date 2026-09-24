import Link from 'next/link'
import type { ProductTeaser } from '@/lib/storefront/productTeaser'

export default function ProductCard({ product }: { product: ProductTeaser }) {
  return (
    <Link href={product.href} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-sm border border-slate-200/90 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.035)] transition duration-300 hover:border-emerald-200 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
        <div className="relative aspect-square overflow-hidden bg-[#f1f2ee]">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.title} className="h-full w-full object-contain p-1 transition duration-500 group-hover:scale-[1.015]" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center px-5 text-center text-xs font-semibold text-slate-400">Image unavailable</div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-3 py-3 sm:px-3.5 sm:py-3.5">
          {product.categoryName && (
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">{product.categoryName}</p>
          )}
          <h2 className="mt-1 line-clamp-2 min-h-9 text-sm font-medium leading-[1.25rem] text-slate-800">{product.title}</h2>

          <div className="mt-auto pt-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-base font-black tabular-nums text-slate-950">
                {product.source === 'import' && product.variantCount > 1 ? 'From ' : ''}{product.currency} {product.price.toLocaleString()}
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-400 transition group-hover:text-[#123f2b]">
              <span>
                {product.variantCount > 1
                  ? 'More options'
                  : product.inStock ? 'Available' : 'Currently unavailable'}
              </span>
              <span aria-hidden="true">→</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
