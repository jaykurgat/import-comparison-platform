import Link from 'next/link'
import type { ProductTeaser } from '@/lib/storefront/productTeaser'

export default function ProductCard({ product }: { product: ProductTeaser }) {
  return (
    <Link href={product.href} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-slate-200/90 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.10)]">
        <div className="relative aspect-[.94] overflow-hidden bg-[#f1f2ee]">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center px-5 text-center text-xs font-semibold text-slate-400">Image unavailable</div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/95 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-700 shadow-sm">
              {product.source === 'import' ? 'Direct import' : 'Local'}
            </span>
            {product.hasDeal && (
              <span className="rounded-full bg-[#123f2b] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white shadow-sm">
                Import comparison
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-4.5">
          {product.categoryName && <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">{product.categoryName}</p>}
          <h2 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-800">{product.title}</h2>

          <div className="mt-auto pt-4">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-base font-black tabular-nums text-slate-950">
                {product.source === 'import' && product.variantCount > 1 ? 'From ' : ''}{product.currency} {product.price.toLocaleString()}
              </span>
              {product.hasDeal && product.savingsAmount !== null && (
                <span className="text-[11px] font-bold text-emerald-700">Save {product.currency} {product.savingsAmount.toLocaleString()}</span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-400 transition group-hover:text-[#123f2b]">
              <span>
                {product.variantCount > 1
                  ? `${product.variantCount} variants${product.inStock ? '' : ' · currently unavailable'}`
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
