import { requireAdmin } from '@/lib/admin/auth'
import { logoutAdmin } from '../actions'
import { getCatalogHealth } from '@/lib/admin/getCatalogHealth'
import Link from 'next/link'

function Metric({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'warning' | 'danger' }) {
  const cls = tone === 'danger'
    ? 'border-[#E5B8AE] bg-[#FFF7F5]'
    : tone === 'warning'
      ? 'border-[#E7D5A8] bg-[#FFFBEF]'
      : 'border-[#E3E3DF] bg-white'

  return (
    <div className={`rounded-lg border p-5 ${cls}`}>
      <div className="text-sm text-[#6B6B6E]">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}

export default async function CatalogHealthPage() {
  await requireAdmin()
  const health = await getCatalogHealth()

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-6 py-10 text-[#1C1C1E]">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E3E3DF] pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Catalog Health</h1>
            <p className="mt-1 text-sm text-[#6B6B6E]">Operational checks for local listings, supplier data, pricing, freight, and matching review.</p>
          </div>
          <form action={logoutAdmin}>
            <button type="submit" className="rounded border border-[#D8D8D3] px-4 py-2 text-sm font-medium hover:bg-white">Sign out</button>
          </form>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/admin/import" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F7F5]">Import local data</Link>
          <Link href="/admin/catalog" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F7F5]">Manage supplier catalog</Link>
          <Link href="/admin/review" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F7F5]">Review matches</Link>
          <Link href="/products" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F7F5]">View storefront</Link>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Local catalog</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total products" value={health.local.total} />
            <Metric label="Missing images" value={health.local.missingImages} tone={health.local.missingImages ? 'warning' : 'neutral'} />
            <Metric label="Missing descriptions" value={health.local.missingDescriptions} tone={health.local.missingDescriptions ? 'warning' : 'neutral'} />
            <Metric label="Out of stock" value={health.local.outOfStock} tone={health.local.outOfStock ? 'warning' : 'neutral'} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Supplier catalog</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="Persisted supplier SKUs" value={health.imports.total} />
            <Metric label="Unpublished" value={health.imports.unpublished} />
            <Metric label="Out of stock" value={health.imports.outOfStock} tone={health.imports.outOfStock ? 'warning' : 'neutral'} />
            <Metric label="Missing sell price" value={health.imports.missingPrice} tone={health.imports.missingPrice ? 'danger' : 'neutral'} />
            <Metric label="Stale sell price" value={health.imports.stalePrice} tone={health.imports.stalePrice ? 'danger' : 'neutral'} />
            <Metric label="Missing/expired Kenya freight" value={health.imports.expiredFreight} tone={health.imports.expiredFreight ? 'warning' : 'neutral'} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Matching workflow</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Metric label="Needs review" value={health.matching.pendingReview} tone={health.matching.pendingReview ? 'warning' : 'neutral'} />
            <Metric label="Rejected candidates" value={health.matching.rejected} />
            <Metric label="Confirmed matches" value={health.matching.confirmed} />
          </div>
        </section>
      </div>
    </main>
  )
}
