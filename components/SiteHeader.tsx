import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getStorefrontCategories } from '@/lib/storefront/getCategories'
import CartHeaderLink from '@/components/CartHeaderLink'

export const dynamic = 'force-dynamic'

export default async function SiteHeader() {
  const now = new Date()
  const [categories, announcement, activeCoupons] = await Promise.all([
    getStorefrontCategories(10),
    prisma.storefrontAnnouncement.findUnique({ where: { key: 'top-bar' } }),
    prisma.coupon.findMany({
      where: { enabled: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
      select: { discountPercent: true },
      distinct: ['discountPercent'],
      orderBy: { discountPercent: 'desc' },
    }),
  ])

  const showBar = announcement?.enabled ?? true
  const message = announcement?.message?.trim() || 'Smart deals. More ways to save.'
  const percentages = announcement?.showCouponPercentages === false ? [] : activeCoupons.map((coupon) => Number(coupon.discountPercent))

  return (
    <header className="sticky top-0 z-50 border-b border-[#dfe5e0] bg-[#fffefa]/95 shadow-[0_2px_14px_rgba(15,32,24,.04)] backdrop-blur-xl">
      {showBar && (
        <div className="bg-[#123f2b] text-[11px] font-semibold text-white/90">
          <div className="mx-auto flex min-h-9 max-w-[1440px] items-center justify-center gap-2 px-3 py-2 sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="truncate">{message}</span>
              {percentages.length > 0 && (
                <span className="hidden shrink-0 items-center gap-1.5 md:flex">
                  {percentages.slice(0, 3).map((percent) => (
                    <span key={percent} className="rounded-sm bg-[#f4b942] px-2 py-0.5 text-[9px] font-black text-[#123f2b]">
                      {percent}% OFF
                    </span>
                  ))}
                </span>
              )}
            </div>
            <Link href="/cart" className="hidden shrink-0 rounded px-2 py-1 font-bold transition hover:bg-white/10 hover:text-[#f4b942] sm:block">
              View cart →
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-[1440px] items-center gap-2.5 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-md bg-[#0b2a21] px-2 py-1.5" aria-label="KijijiCart home">
          <Image src="/kijijcart-mark.svg" alt="" width={32} height={32} className="h-8 w-8 sm:h-9 sm:w-9" priority />
          <span className="hidden text-[1.35rem] font-extrabold tracking-[-0.055em] text-white min-[480px]:inline sm:text-[1.45rem]">
            Kijiji<span className="text-[#f4b942]">Cart</span>
          </span>
        </Link>

        <form action="/products" className="hidden min-w-0 flex-1 md:flex">
          <label htmlFor="site-search" className="sr-only">Search products</label>
          <input
            id="site-search"
            name="q"
            placeholder="Search products, brands and categories"
            className="h-11 min-w-0 flex-1 rounded-l-lg border border-slate-200 bg-[#f3f5f1] px-4 text-sm text-slate-900 outline-none transition focus:border-[#123f2b] focus:bg-white"
          />
          <button className="h-11 shrink-0 rounded-r-lg bg-[#f4b942] px-5 text-sm font-black text-[#182017] transition hover:bg-[#eab02f]">
            Search
          </button>
        </form>

        <nav className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <Link href="/products" className="hidden rounded-md px-2.5 py-2 text-sm font-bold text-slate-700 transition hover:bg-[#fff4d6] hover:text-[#123f2b] lg:block">
            Shop
          </Link>
          <CartHeaderLink />
        </nav>
      </div>

      <div className="border-t border-slate-100 bg-[#fffefa] md:hidden">
        <form action="/products" className="flex gap-0 px-3 py-2.5 sm:px-4">
          <label htmlFor="mobile-site-search" className="sr-only">Search products</label>
          <input
            id="mobile-site-search"
            name="q"
            placeholder="Search products..."
            className="h-10 min-w-0 flex-1 rounded-l-lg border border-slate-200 bg-[#f3f5f1] px-3 text-sm outline-none focus:border-[#123f2b] focus:bg-white"
          />
          <button className="h-10 shrink-0 rounded-r-lg bg-[#f4b942] px-4 text-xs font-black text-[#182017]">
            Search
          </button>
        </form>
      </div>

      <nav className="border-t border-slate-100 bg-white" aria-label="Product categories">
        <div className="kc-scroll-row mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-3 py-2 sm:gap-2 sm:px-6">
          <Link href="/products" className="shrink-0 rounded-md border border-transparent px-2.5 py-1.5 text-[11px] font-extrabold text-[#345447] transition hover:border-[#f4b942] hover:bg-[#fff7e2] hover:text-[#123f2b]">
            All products
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={{ pathname: '/products', query: { category: category.id } }}
              className="shrink-0 rounded-md border border-transparent px-2.5 py-1.5 text-[11px] font-extrabold text-[#345447] transition hover:border-[#f4b942] hover:bg-[#fff7e2] hover:text-[#123f2b]"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}