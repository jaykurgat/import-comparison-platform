import Link from 'next/link'
import type { StorefrontCategory } from '@/lib/storefront/getCategories'

export default function CategoryGrid({ categories }: { categories: StorefrontCategory[] }) {
  if (!categories.length) return null

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Shop by category</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">What are you shopping for?</h2>
        </div>
        <Link href="/products" className="hidden text-sm font-bold text-emerald-800 hover:underline sm:block">View all categories →</Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={{ pathname: '/products', query: { category: category.id } }}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="relative aspect-square overflow-hidden bg-[#f0f1ec]">
              {category.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={category.imageUrl}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-black uppercase tracking-wider text-slate-400">
                  {category.source === 'ALIEXPRESS' ? 'AliExpress' : 'Local'}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-10">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/80">
                  {category.productCount} products
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="line-clamp-2 text-sm font-extrabold leading-5 text-slate-900">{category.name}</h3>
              <span className="mt-2 inline-flex text-xs font-black text-emerald-800">Shop now →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
