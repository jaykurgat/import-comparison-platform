import Link from 'next/link'
import type { ProductTeaser } from '@/lib/storefront/productTeaser'

export default function ProductCard({ product }: { product: ProductTeaser }) {
  return (
    <Link href={product.href} className="group">
      <div className="aspect-square overflow-hidden rounded-lg border border-[#EDEDEC] bg-[#FAFAF9]">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[#8A8A8E]">No image</div>
        )}
      </div>
      <div className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{product.title}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-sm font-semibold tabular-nums">
          {product.currency} {product.price.toLocaleString()}
        </span>
        {product.hasDeal && product.savingsAmount !== null && (
          <span className="rounded bg-[#1B5E4A]/10 px-1.5 py-0.5 text-xs font-medium text-[#1B5E4A]">
            Save {product.currency} {product.savingsAmount.toLocaleString()}
          </span>
        )}
      </div>
    </Link>
  )
}
