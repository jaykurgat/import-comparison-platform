import Link from 'next/link'
import type { StorefrontCategory } from '@/lib/storefront/getCategories'

const fallbackVisuals = ['01', '02', '03', '04', '05', '06', '07', '08']

export default function CategoryGrid({ categories }: { categories: StorefrontCategory[] }) {
  if (!categories.length) return null

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Browse the store</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Shop by category</h2>
        </div>
        <Link href="/products" className="text-sm font-bold text-emerald-800 hover:underline">View all</Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={{ pathname: '/products', query: { category: category.id } }}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef7f2] text-xs font-black text-emerald-800">
              {fallbackVisuals[index % fallbackVisuals.length]}
            </div>
            <h3 className="mt-5 line-clamp-2 text-sm font-extrabold text-slate-900">{category.name}</h3>
            <p className="mt-1 text-xs text-slate-500">{category.productCount} products</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
