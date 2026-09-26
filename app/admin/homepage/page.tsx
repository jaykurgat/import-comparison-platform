export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { logoutAdmin } from '../actions'
import { getHomepageHero } from '@/lib/homepage/hero'
import HeroEditor from './HeroEditor'

export default async function AdminHomepagePage() {
  await requireAdmin()
  const hero = await getHomepageHero()
  return <main className="min-h-screen bg-[#F7F7F5] px-6 py-10 text-[#1C1C1E]">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E3E3DF] pb-6">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#2F6B4F]">Storefront</p><h1 className="mt-2 text-3xl font-black tracking-tight">Homepage Hero</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6B6E]">Create banners, carousels and multi-column hero layouts from the admin without changing code.</p></div>
        <form action={logoutAdmin}><button type="submit" className="border border-[#D8D8D3] px-4 py-2 text-sm font-medium hover:bg-white">Sign out</button></form>
      </header>
      <nav className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin" className="border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Dashboard</Link>
        <Link href="/admin/catalog" className="border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Supplier catalog</Link>
        <Link href="/admin/orders" className="border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Orders</Link>
        <Link href="/" className="border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">View storefront</Link>
      </nav>
      <div className="mt-8"><HeroEditor initial={hero} /></div>
    </div>
  </main>
}
