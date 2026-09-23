import { requireAdmin } from '@/lib/admin/auth'
import { logoutAdmin } from '../actions'
import CsvImportForm from './CsvImportForm'
import { promoteImportedListings } from './actions'

async function promoteListingsAction(): Promise<void> {\n  await promoteImportedListings()\n}\n\nexport default async function ImportPage() {
  await requireAdmin()

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-6 py-10 text-[#1C1C1E]">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Local Catalog Import</h1>
            <p className="mt-1 text-sm text-[#6B6B6E]">Upload a CSV, validate it, then promote accepted rows into the canonical local catalog.</p>
          </div>
          <div className="flex gap-2">
            <a href="/admin/health" className="rounded border border-[#D8D8D3] px-4 py-2 text-sm font-medium hover:bg-white">Catalog health</a>
            <form action={logoutAdmin}>
              <button type="submit" className="rounded border border-[#D8D8D3] px-4 py-2 text-sm font-medium hover:bg-white">Sign out</button>
            </form>
          </div>
        </div>

        <CsvImportForm />

        <section className="mt-8 rounded-lg border border-[#E3E3DF] bg-white p-5">
          <h2 className="font-medium">Promote accepted rows</h2>
          <p className="mt-1 text-sm text-[#6B6B6E]">This updates canonical LocalSKU records from the newest raw row for each source reference. Raw rows remain as the audit trail.</p>
          <form action={promoteListingsAction} className="mt-4">
            <button type="submit" className="rounded border border-[#2F6B4F] px-4 py-2 text-sm font-medium text-[#2F6B4F] hover:bg-[#F2F8F5]">Promote local listings</button>
          </form>
        </section>
      </div>
    </main>
  )
}
