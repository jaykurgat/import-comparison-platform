import Link from 'next/link'
import type { StorefrontCategory } from '@/lib/storefront/getCategories'

export default function CategoryGrid({ categories }: { categories: StorefrontCategory[] }) {
  if (!categories.length) return null

  return (
    <section className="kc-section">
      <div className="kc-section-heading">
        <div>
          <p className="kc-section-kicker">Shop by category</p>
          <h2 className="kc-section-title">Shop by category</h2>
        </div>
        <Link href="/products" className="hidden text-xs font-bold text-[#007185] hover:underline sm:block">
          View all →
        </Link>
      </div>

      <div className="kc-scroll-row mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={{ pathname: '/products', query: { category: category.id } }}
            className="group flex min-w-0 flex-col items-center rounded-md border border-transparent p-2 transition hover:border-[#d5d9d9] hover:bg-[#f0f2f2]"
          >
            <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-[#e7e7e7] bg-[#f0f2f2] sm:h-16 sm:w-16">
              {category.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={category.imageUrl}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-2 text-center text-[9px] font-black uppercase tracking-wider text-[#565959]">
                  Browse
                </div>
              )}
            </div>
            <div className="w-full p-1.5 text-center">
              <h3 className="line-clamp-2 min-h-0 text-[10px] font-bold leading-4 text-[#0f1111] sm:text-[11px]">
                {category.name}
              </h3>
              <span className="mt-0.5 inline-flex text-[9px] font-semibold text-[#007185] sm:text-[10px]">Shop now →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}