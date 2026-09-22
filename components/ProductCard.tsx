import Link from 'next/link'
import type { ProductTeaser } from '@/lib/storefront/productTeaser'

export default function ProductCard({ product }: { product: ProductTeaser }) {
  return (
    <Link href={product.href} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
          )}
          {product.hasDeal && (
            <span className="absolute left-2 top-2 rounded-full bg-[#0f5132] px-2.5 py-1 text-[11px] font-bold text-white">IMPORT DEAL</span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3">
          <h2 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-slate-800">{product.title}</h2>
          <div className="mt-auto pt-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-base font-black tabular-nums text-slate-950">{product.currency} {product.price.toLocaleString()}</span>
              {product.hasDeal && product.savingsAmount !== null && (
                <span className="text-[11px] font-bold text-[#0f5132]">Save {product.currency} {product.savingsAmount.toLocaleString()}</span>
              )}
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-400 group-hover:text-[#0f5132]">View product →</div>
          </div>
        </div>
      </article>
    </Link>
  )
}
