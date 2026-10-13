import Link from 'next/link'
import type { StorefrontCategory } from '@/lib/storefront/getCategories'

export default function CategoryGrid({ categories }: { categories: StorefrontCategory[] }) {
  if (!categories.length) return null

  return (
    <section className="kc-section">
      <div className="kc-section-heading">
        <div>
          <p className="kc-section-kicker">Find your next favourite</p>
          <h2 className="kc-section-title">Shop by category</h2>
        </div>
        <Link href="/products" className="hidden text-xs font-bold text-[#315D40] transition hover:text-[#123F2B] sm:block">
          Explore all products <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={{ pathname: '/products', query: { category: category.id } }}
            className="group flex min-w-0 items-center gap-3 rounded-xl border border-[#E6E9E3] bg-white p-3 transition duration-200 hover:-translate-y-0.5 hover:border-[#C8D7C9] hover:bg-[#F8FBF7] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78917C]"
          >
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F1F4EF] sm:h-14 sm:w-14">
              {category.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={category.imageUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
              ) : (
                <span className="text-lg font-semibold text-[#5B765E]" aria-hidden="true">{category.name.slice(0, 1).toLocaleUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-xs font-semibold leading-4 text-[#243629] sm:text-[13px]">{category.name}</h3>
              <p className="mt-1 text-[10px] text-[#7A847A]">{category.productCount.toLocaleString()} items</p>
            </div>
            <span aria-hidden="true" className="shrink-0 text-xs text-[#879487] transition group-hover:translate-x-0.5 group-hover:text-[#315D40]">↗</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
