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
    <header className="sticky top-0 z-50 bg-[#131921] text-white shadow-[0_2px_8px_rgba(0,0,0,.18)]">
      <div className="bg-[#232f3e] px-3 py-1.5 text-center text-[11px] font-medium">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <span>🎉 {message}</span><span>🚚 Free delivery to Kenya on eligible orders</span><span className="hidden sm:inline">⚡ New deals added regularly</span>
          {percentages.slice(0, 2).map((percent) => <span key={percent} className="rounded-sm bg-[#ff9900] px-1.5 py-0.5 text-[9px] font-black text-[#131921]">{percent}% OFF</span>)}
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-2 py-2 sm:gap-3 sm:px-3">
        <Link href="/" className="flex shrink-0 items-center gap-1 rounded-sm border border-transparent px-1.5 py-1.5 transition hover:border-white" aria-label="KijijiCart home">
          <Image src="/kijijcart-mark.svg" alt="" width={34} height={34} className="h-8 w-8" priority />
          <span className="hidden text-[22px] font-extrabold tracking-[-0.05em] min-[430px]:inline">Kijiji<span className="text-[#ff9900]">Cart</span></span>
        </Link>
        <div className="hidden shrink-0 items-center gap-1 rounded-sm border border-transparent px-2 py-1.5 md:flex">
          <span className="text-lg">⌖</span><span className="text-[9px] leading-3 text-[#ccc]">Deliver to<strong className="block text-[12px] text-white">Kenya 🇰🇪</strong></span>
        </div>
        <form action="/products" className="flex min-w-0 flex-1 overflow-hidden rounded-[3px] border-2 border-[#ff9900] bg-white">
          <select name="category" defaultValue="" aria-label="Search category" className="hidden h-10 max-w-[105px] shrink-0 border-0 border-r border-[#d5d9d9] bg-[#f3f3f3] px-2 text-[11px] text-[#565959] outline-none sm:block">
            <option value="">All</option>{categories.slice(0, 8).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <label htmlFor="site-search" className="sr-only">Search products</label>
          <input id="site-search" name="q" placeholder="Search KijijiCart" className="h-10 min-w-0 flex-1 border-0 bg-white px-3 text-sm text-[#0f1111] outline-none" />
          <button aria-label="Search" className="flex h-10 w-11 shrink-0 items-center justify-center bg-[#ff9900] text-lg text-[#131921] transition hover:bg-[#e47911]">⌕</button>
        </form>
        <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Link href="/products" className="hidden rounded-sm border border-transparent px-2 py-1.5 transition hover:border-white md:block"><span className="block text-[9px] text-[#ccc]">Explore</span><span className="block whitespace-nowrap text-[12px] font-bold">Shop</span></Link>
          <CartHeaderLink />
        </nav>
      </div>
      <nav className="border-t border-[#3a4553] bg-[#232f3e]" aria-label="Product categories">
        <div className="mx-auto flex max-w-[1440px] items-center overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href="/products" className="flex h-9 shrink-0 items-center gap-1 rounded-sm border border-transparent px-3 text-[12px] font-bold transition hover:border-white">☰ <span>All</span></Link>
          <Link href="/products" className="flex h-9 shrink-0 items-center rounded-sm border border-transparent px-3 text-[12px] transition hover:border-white">All Products</Link>
          {categories.map((category) => <Link key={category.id} href={{ pathname: '/products', query: { category: category.id } }} className="flex h-9 shrink-0 items-center rounded-sm border border-transparent px-3 text-[12px] transition hover:border-white">{category.name}</Link>)}
          <Link href="/products?sort=newest" className="flex h-9 shrink-0 items-center gap-1 rounded-sm border border-transparent px-3 text-[12px] font-bold text-[#ff9900] transition hover:border-white">⚡ New deals</Link>
        </div>
      </nav>
      <div className="border-t border-[#3a4553] bg-[#131921] md:hidden">
        <form action="/products" className="flex px-2 py-2"><input name="q" placeholder="Search products..." className="h-9 min-w-0 flex-1 rounded-l-[3px] border-0 bg-white px-3 text-xs text-[#0f1111] outline-none" /><button className="h-9 w-11 rounded-r-[3px] bg-[#ff9900] text-[#131921]">⌕</button></form>
      </div>
    </header>
  )
}