import Link from 'next/link'
import type { ProductTeaser } from '@/lib/storefront/productTeaser'

export default function ProductCard({ product }: { product: ProductTeaser }) {
  return (
    <Link href={product.href} className="kc-product-card group block">
      <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-sm border border-[#e7e7e7] bg-white shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-[#ff9900] hover:shadow-[0_4px_20px_rgba(15,17,17,.12)]">
        <div className="kc-product-image relative overflow-hidden">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-[11px] font-bold text-[#565959]">
              Image unavailable
            </div>
          )}

          {product.freeShipping && (
            <span className="absolute left-2 top-2 rounded-sm bg-[#ff9900] px-1.5 py-1 text-[9px] font-black uppercase tracking-wide text-[#0f1111] shadow-sm">
              Free shipping
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-3.5">
          {product.categoryName && (
            <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.13em] text-slate-400">
              {product.categoryName}
            </p>
          )}

          <h2 className="kc-product-title mt-1 min-h-[2.65rem] text-[12px] font-bold leading-[1.35] text-[#0f1111] sm:text-[12.5px]">
            {product.title}
          </h2>

          <div className="mt-auto pt-3">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="truncate text-[16px] font-extrabold tabular-nums text-[#b12704] sm:text-base">
                {product.source === 'import' && product.variantCount > 1 ? 'From ' : ''}{product.currency} {product.price.toLocaleString()}
              </span>
            </div>

            {product.freeShipping && (
              <p className="mt-1 text-[10px] font-semibold text-[#007600]">Ships from China · 14–45 days</p>
            )}

            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#e7e7e7] pt-2.5 text-[10px] font-bold text-slate-400 transition group-hover:text-[#007185]">
              <span className="truncate">
                {product.variantCount > 1
                  ? 'More options'
                  : product.inStock ? 'Available' : 'Unavailable'}
              </span>
              <span aria-hidden="true" className="shrink-0 text-sm">→</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}