import Link from 'next/link'
import type { StorefrontCategory } from '@/lib/storefront/getCategories'

export default function CategoryGrid({ categories }: { categories: StorefrontCategory[] }) {
  if (!categories.length) return null

  return (
    <section className="kc-section">
      <div className="kc-section-heading">
        <div>
          <p className="kc-section-kicker">Shop by category</p>
          <h2 className="kc-section-title">What are you shopping for?</h2>
        </div>
        <Link href="/products" className="hidden text-xs font-black text-[#176043] hover:underline sm:block">
          View all →
        </Link>
      </div>

      <div className="kc-scroll-row mt-4 flex gap-2.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={{ pathname: '/products', query: { category: category.id } }}
            className="group w-[140px] shrink-0 overflow-hidden rounded-lg border border-[#e2e6e1] bg-white shadow-[0_2px_8px_rgba(18,32,24,.035)] transition hover:-translate-y-0.5 hover:border-[#c9d9cf] hover:shadow-md sm:w-auto"
          >
            <div className="relative aspect-square overflow-hidden bg-[#f0f2ee]">
              {category.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={category.imageUrl}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Browse
                </div>
              )}
            </div>
            <div className="p-3 sm:p-3.5">
              <h3 className="line-clamp-2 min-h-[2.5rem] text-xs font-extrabold leading-5 text-slate-900 sm:text-sm">
                {category.name}
              </h3>
              <span className="mt-1.5 inline-flex text-[10px] font-black text-[#176043] sm:text-xs">Shop now →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}