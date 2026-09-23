export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { logoutAdmin } from './actions'
import { getCatalogHealth } from '@/lib/admin/getCatalogHealth'
import { getOperationalHealth } from '@/lib/admin/getOperationalHealth'

function Metric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${danger && value > 0 ? 'border-[#E5B8AE] bg-[#FFF7F5]' : 'border-[#E3E3DF] bg-white'}`}>
      <div className="text-sm text-[#6B6B6E]">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="rounded-lg border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F7F5]">{children}</Link>
}

export default async function AdminDashboardPage() {
  await requireAdmin()
  const [catalog, operations] = await Promise.all([getCatalogHealth(), getOperationalHealth()])

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-6 py-10 text-[#1C1C1E]">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E3E3DF] pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2F6B4F]">Operations</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Admin dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6B6E]">One operational view for catalog readiness, matching review, customer payments, and supplier fulfillment.</p>
          </div>
          <form action={logoutAdmin}><button type="submit" className="rounded-lg border border-[#D8D8D3] px-4 py-2 text-sm font-medium hover:bg-white">Sign out</button></form>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2">
          <NavLink href="/admin/health">Catalog health</NavLink>
          <NavLink href="/admin/import">Local import</NavLink>
          <NavLink href="/admin/catalog">Supplier catalog</NavLink>
          <NavLink href="/admin/review">Match review</NavLink>
          <NavLink href="/admin/orders">Orders</NavLink>
          <NavLink href="/admin/settings">Settings</NavLink>
          <NavLink href="/products">Storefront</NavLink>
        </nav>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div><h2 className="text-lg font-semibold">Commerce operations</h2><p className="mt-1 text-sm text-[#6B6B6E]">Current order and payment state.</p></div>
            <Link href="/admin/orders" className="text-sm font-medium text-[#2F6B4F]">Open orders →</Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Payment pending" value={operations.orders.paymentPending} danger />
            <Metric label="Paid / awaiting supplier" value={operations.orders.paid} danger />
            <Metric label="Supplier submission in progress" value={operations.orders.submitting} danger />
            <Metric label="Failed orders" value={operations.orders.failed} danger />
            <Metric label="Submitted orders" value={operations.orders.submitted} />
            <Metric label="Cancelled orders" value={operations.orders.cancelled} />
            <Metric label="Pending payments" value={operations.payments.pending} danger />
            <Metric label="Confirmed payments" value={operations.payments.paid} />
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div><h2 className="text-lg font-semibold">Last 24 hours</h2><p className="mt-1 text-sm text-[#6B6B6E]">Recent operational activity.</p></div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Metric label="New import orders" value={operations.recent.ordersLast24h} />
            <Metric label="Payments confirmed" value={operations.recent.paidLast24h} />
            <Metric label="Orders failed" value={operations.recent.failedLast24h} danger />
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div><h2 className="text-lg font-semibold">Readiness</h2><p className="mt-1 text-sm text-[#6B6B6E]">Data that needs operator attention.</p></div>
            <Link href="/admin/health" className="text-sm font-medium text-[#2F6B4F]">Open health →</Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Match review queue" value={catalog.matching.pendingReview} danger />
            <Metric label="Supplier SKUs unpublished" value={catalog.imports.unpublished} />
            <Metric label="Supplier prices stale" value={catalog.imports.stalePrice} danger />
            <Metric label="Supplier freight expired/missing" value={catalog.imports.expiredFreight} danger />
          </div>
        </section>
      </div>
    </main>
  )
}
