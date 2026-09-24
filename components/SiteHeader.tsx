import Link from 'next/link'
import { getStorefrontCategories } from '@/lib/storefront/getCategories'

export const dynamic = 'force-dynamic'

export default async function SiteHeader() {
  const categories = await getStorefrontCategories(8)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#fffefa]/95 backdrop-blur-xl">
      <div className="bg-[#123f2b] text-[11px] font-semibold text-white/90">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <span>Clear local prices. Verified import alternatives.</span>
          <Link href="/products?source=deals" className="hidden hover:text-white sm:block">Browse comparisons →</Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="KijijiCart home">
          <img src="/kijijcart-mark.svg" alt="" className="h-9 w-9" />
          <span className="text-[1.45rem] font-bold tracking-[-0.045em] text-[#123f2b]">
            Kijiji<span className="text-[#45bd45]">Cart</span>
          </span>
        </Link>

        <form action="/products" className="hidden min-w-0 flex-1 md:flex">
          <label htmlFor="site-search" className="sr-only">Search products</label>
          <input id="site-search" name="q" placeholder="Search products, brands and categories" className="h-11 min-w-0 flex-1 rounded-l-xl border border-slate-200 bg-[#f5f5f1] px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:bg-white" />
          <button className="h-11 rounded-r-xl bg-amber-400 px-6 text-sm font-black text-slate-950 transition hover:bg-amber-300">Search</button>
        </form>

        <nav className="hidden items-center gap-5 lg:flex">
          <Link href="/products" className="text-sm font-bold text-slate-700 hover:text-[#123f2b]">Shop</Link>
          <Link href="/products?source=deals" className="text-sm font-bold text-slate-700 hover:text-[#123f2b]">Compare</Link>
        </nav>
      </div>

      <div className="border-t border-slate-100 md:hidden">
        <form action="/products" className="flex px-4 py-3">
          <label htmlFor="mobile-site-search" className="sr-only">Search products</label>
          <input id="mobile-site-search" name="q" placeholder="Search products..." className="h-10 min-w-0 flex-1 rounded-l-xl border border-slate-200 bg-[#f5f5f1] px-3 text-sm outline-none focus:border-emerald-700 focus:bg-white" />
          <button className="h-10 rounded-r-xl bg-amber-400 px-4 text-sm font-black text-slate-950">Search</button>
        </form>
      </div>

      <nav className="border-t border-slate-100 bg-white" aria-label="Product categories">
        <div className="mx-auto flex max-w-[1440px] gap-7 overflow-x-auto px-4 py-3 sm:px-6">
          <Link href="/products" className="whitespace-nowrap text-xs font-bold text-slate-600 transition hover:text-[#123f2b]">All products</Link>
          <Link href="/products?source=deals" className="whitespace-nowrap text-xs font-bold text-slate-600 transition hover:text-[#123f2b]">Comparisons</Link>
          {categories.map((category) => (
            <Link key={category.id} href={{ pathname: '/products', query: { category: category.id } }} className="whitespace-nowrap text-xs font-bold text-slate-600 transition hover:text-[#123f2b]">
              {category.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
