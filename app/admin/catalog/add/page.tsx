export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { logoutAdmin } from '../../actions'
import AddAliExpressProductForm from './AddAliExpressProductForm'

export default async function AddImportProductPage() {
  await requireAdmin()

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-6 py-10 text-[#1C1C1E]">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E3E3DF] pb-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2F6B4F]">Supplier catalog</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Add AliExpress product</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6B6E]">
              Add a specific real AliExpress product without relying on discovery from the local catalog.
            </p>
          </div>
          <form action={logoutAdmin}>
            <button type="submit" className="rounded border border-[#D8D8D3] px-4 py-2 text-sm font-medium hover:bg-white">
              Sign out
            </button>
          </form>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2">
          <Link href="/admin" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Dashboard</Link>
          <Link href="/admin/catalog" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Supplier catalog</Link>
          <Link href="/admin/health" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Health</Link>
        </nav>

        <AddAliExpressProductForm />
      </div>
    </main>
  )
}
