import Link from 'next/link'
import type { ProductTeaser } from '@/lib/storefront/productTeaser'

export default function ProductCard({ product }: { product: ProductTeaser }) {
  return (
    <Link href={product.href} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">
        <div className="relative aspect-[.94] overflow-hidden bg-[#f1f2ee]">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">Image unavailable</div>
          )}
          {product.hasDeal && (
            <span className="absolute left-3 top-3 rounded-full bg-[#123f2b] px-2.5 py-1.5 text-[10px] font-black tracking-wider text-white">
              IMPORT DEAL
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h2 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-800">{product.title}</h2>
          <div className="mt-auto pt-4">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-base font-black tabular-nums text-slate-950">{product.currency} {product.price.toLocaleString()}</span>
              {product.hasDeal && product.savingsAmount !== null && (
                <span className="text-[11px] font-bold text-emerald-700">Save {product.currency} {product.savingsAmount.toLocaleString()}</span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-400 transition group-hover:text-[#123f2b]">
              <span>View details</span>
              <span aria-hidden="true">→</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
