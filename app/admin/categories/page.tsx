export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'
import CategoryManager from './CategoryManager'

export default async function AdminCategoriesPage() {
  await requireAdmin()

  const categories = await prisma.category.findMany({
    select: { id: true, name: true, parentId: true, isActive: true, sortOrder: true },
    orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
  })

  return (
    <main className="min-h-screen bg-[#F5F7F3] px-4 py-6 text-[#1C1C1E] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-[#E3E3DF] pb-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2F6B4F]">Catalog structure</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6B6E]">Manage your catalogue structure and storefront visibility. Primary categories sit at the top; nested categories create precise paths for browsing and recommendations.</p>
        </header>
        <nav className="mt-6 flex flex-wrap gap-2">
          <Link href="/admin" className="border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Dashboard</Link>
          <Link href="/admin/catalog" className="border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Supplier catalog</Link>
          <Link href="/admin/import" className="border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Local import</Link>
          <Link href="/admin/promotions" className="border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Promotions</Link>
        </nav>
        <div className="mt-8">
          <CategoryManager categories={categories} />
        </div>
      </div>
    </main>
  )
}
