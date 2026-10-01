export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'
import { logoutAdmin } from '../actions'
import { saveAnnouncement, createCoupon, toggleCoupon } from './actions'

export default async function PromotionsPage() {
  await requireAdmin()
  const [announcement, coupons, categories] = await Promise.all([
    prisma.storefrontAnnouncement.findUnique({ where: { key: 'top-bar' } }),
    prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.category.findMany({ select: { id: true, name: true, parentId: true }, orderBy: [{ parentId: 'asc' }, { name: 'asc' }] }),
  ])
  return <main className="min-h-screen bg-[#F7F7F5] px-6 py-10 text-[#1C1C1E]"><div className="mx-auto max-w-6xl">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E3E3DF] pb-6"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#2F6B4F]">Storefront</p><h1 className="mt-2 text-3xl font-black tracking-tight">Promotions</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6B6E]">Edit the top bar and create percentage coupons for products or category branches.</p></div><form action={logoutAdmin}><button type="submit" className="border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Sign out</button></form></header>
    <nav className="mt-6 flex flex-wrap gap-2"><Link href="/admin" className="border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Dashboard</Link><Link href="/admin/categories" className="border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Categories</Link><Link href="/admin/catalog" className="border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Supplier catalog</Link><Link href="/" className="border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Storefront</Link></nav>
    <section className="mt-8 border border-[#E3E3DF] bg-white p-5 sm:p-6"><h2 className="text-lg font-black">Top promotional bar</h2><p className="mt-1 text-sm text-[#6B6B6E]">The message appears above navigation. Active coupon percentages can appear beside it automatically.</p>
      <form action={saveAnnouncement} className="mt-5 grid gap-4"><label className="text-sm font-bold">Message<textarea name="message" defaultValue={announcement?.message ?? 'Smart deals. More ways to save.'} rows={2} className="mt-2 block w-full border border-[#D8D8D3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#123F2B]" /></label><div className="flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="enabled" defaultChecked={announcement?.enabled ?? true} /> Show promotional bar</label><label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="showCouponPercentages" defaultChecked={announcement?.showCouponPercentages ?? true} /> Show active coupon percentages</label></div><button className="w-fit bg-[#123F2B] px-5 py-2.5 text-sm font-black text-white">Save top bar</button></form>
    </section>
    <section className="mt-8 border border-[#E3E3DF] bg-white p-5 sm:p-6"><h2 className="text-lg font-black">Create coupon</h2><p className="mt-1 text-sm text-[#6B6B6E]">Target exact product keys or select categories. Category targets include their child categories.</p>
      <form action={createCoupon} className="mt-5 grid gap-5"><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-bold">Code<input name="code" required placeholder="SAVE10" className="mt-2 block w-full border border-[#D8D8D3] px-3 py-2.5 text-sm uppercase outline-none focus:border-[#123F2B]" /></label><label className="text-sm font-bold">Discount %<input name="discountPercent" required type="number" min="0.01" max="100" step="0.01" placeholder="10" className="mt-2 block w-full border border-[#D8D8D3] px-3 py-2.5 text-sm outline-none focus:border-[#123F2B]" /></label><label className="text-sm font-bold">Internal name<input name="name" placeholder="Weekend offer" className="mt-2 block w-full border border-[#D8D8D3] px-3 py-2.5 text-sm outline-none focus:border-[#123F2B]" /></label></div>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="appliesToAll" /> Apply to all products</label>
        <label className="text-sm font-bold">Exact product keys<textarea name="productKeys" rows={4} placeholder={'One per line\nlocal:SKU123\nsupplier:100500123456789:123456789'} className="mt-2 block w-full border border-[#D8D8D3] px-3 py-2.5 font-mono text-xs outline-none focus:border-[#123F2B]" /></label>
        <div><div className="text-sm font-bold">Category targets</div><select name="categoryIds" multiple size={Math.min(8, Math.max(4, categories.length))} className="mt-2 w-full border border-[#D8D8D3] bg-white px-3 py-2 text-sm outline-none focus:border-[#123F2B]">{categories.map((category)=><option key={category.id} value={category.id}>{categoryPath(category.id,categories)}</option>)}</select><p className="mt-1 text-xs text-[#8A8A8E]">Hold Ctrl/Cmd to select multiple categories.</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Starts<input name="startsAt" type="datetime-local" className="mt-2 block w-full border border-[#D8D8D3] px-3 py-2.5 text-sm outline-none" /></label><label className="text-sm font-bold">Ends<input name="endsAt" type="datetime-local" className="mt-2 block w-full border border-[#D8D8D3] px-3 py-2.5 text-sm outline-none" /></label></div>
        <button className="w-fit bg-[#123F2B] px-5 py-2.5 text-sm font-black text-white">Create coupon</button>
      </form>
    </section>
    <section className="mt-8 border border-[#E3E3DF] bg-white p-5 sm:p-6"><h2 className="text-lg font-black">Coupon codes</h2><div className="mt-4 divide-y divide-[#EAEAE5]">{coupons.length === 0 && <p className="py-5 text-sm text-[#6B6B6E]">No coupons yet.</p>}{coupons.map((coupon)=><div key={coupon.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-black">{coupon.code}</span><span className="bg-[#FFF4D6] px-2 py-1 text-[10px] font-black text-[#8A5A00]">{Number(coupon.discountPercent)}% OFF</span><span className={coupon.enabled ? 'bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-800' : 'bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500'}>{coupon.enabled ? 'Active' : 'Paused'}</span></div><div className="mt-1 text-xs text-[#6B6B6E]">{coupon.appliesToAll ? 'All products' : (coupon.productKeys.length + ' product key' + (coupon.productKeys.length === 1 ? '' : 's') + ' · ' + coupon.categoryIds.length + ' categor' + (coupon.categoryIds.length === 1 ? 'y' : 'ies'))}</div></div><form action={toggleCoupon.bind(null, coupon.id)}><button className="border border-[#D8D8D3] bg-white px-3 py-1.5 text-xs font-bold hover:border-[#F5A400]">{coupon.enabled ? 'Pause' : 'Activate'}</button></form></div>)}</div></section>
  </div></main>
}

function categoryPath(id: string, categories: Array<{ id: string; name: string; parentId: string | null }>) {
  const byId = new Map(categories.map((category)=>[category.id,category]))
  const parts: string[] = [], seen = new Set<string>()
  let current = byId.get(id)
  while (current && !seen.has(current.id)) { seen.add(current.id); parts.unshift(current.name); current = current.parentId ? byId.get(current.parentId) : undefined }
  return parts.join(' / ')
}