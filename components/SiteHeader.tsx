import Link from 'next/link'

const categories = ['Electronics', 'Home & Kitchen', 'Beauty', 'Fashion', 'Health', 'Office', 'Deals']

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="bg-[#0f5132] text-xs text-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-2 sm:px-6">
          <span>Shop locally. Compare imported alternatives.</span>
          <Link href="/products" className="hidden hover:underline sm:block">Explore all products →</Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="shrink-0 text-2xl font-black tracking-tight text-[#0f5132]">
          Kijiji<span className="text-[#f59e0b]">Cart</span>
        </Link>
        <form action="/products" className="hidden flex-1 md:flex">
          <label htmlFor="site-search" className="sr-only">Search products</label>
          <input id="site-search" name="q" placeholder="Search products, brands and categories" className="h-11 w-full rounded-l-lg border border-slate-300 bg-slate-50 px-4 text-sm outline-none focus:border-[#0f5132] focus:bg-white" />
          <button className="h-11 rounded-r-lg bg-[#f59e0b] px-6 text-sm font-bold text-slate-950">Search</button>
        </form>
        <Link href="/products" className="hidden text-sm font-semibold text-slate-700 lg:block">Categories</Link>
        <Link href="/products" className="hidden text-sm font-semibold text-slate-700 lg:block">Deals</Link>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <form action="/products" className="flex">
          <label htmlFor="mobile-site-search" className="sr-only">Search products</label>
          <input id="mobile-site-search" name="q" placeholder="Search products..." className="h-10 min-w-0 flex-1 rounded-l-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-[#0f5132] focus:bg-white" />
          <button className="h-10 rounded-r-lg bg-[#f59e0b] px-4 text-sm font-bold text-slate-950">Search</button>
        </form>
      </div>
      <nav className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-[1400px] gap-6 overflow-x-auto px-4 py-3 text-sm font-medium text-slate-600 sm:px-6">
          {categories.map((category) => (
            <Link key={category} href="/products" className="whitespace-nowrap hover:text-[#0f5132]">{category}</Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
