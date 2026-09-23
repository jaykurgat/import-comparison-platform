export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { logoutAdmin } from '../actions'

function Status({ configured }: { configured: boolean }) {
  return <span className={configured ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800' : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500'}>{configured ? 'Configured' : 'Not configured'}</span>
}

export default async function AdminSettingsPage() {
  await requireAdmin()
  const integrations = [
    ['Google Analytics 4', 'Traffic, product views and ecommerce events.', 'NEXT_PUBLIC_GA_MEASUREMENT_ID', Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)],
    ['Google Search Console', 'Search visibility, indexing and organic search performance.', 'NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION', Boolean(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION)],
    ['Google Tag Manager', 'Reserved extension point for additional marketing tags.', 'NEXT_PUBLIC_GTM_ID', Boolean(process.env.NEXT_PUBLIC_GTM_ID)],
  ] as const

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-6 py-10 text-[#1C1C1E]">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E3E3DF] pb-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2F6B4F]">Administration</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Platform settings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6B6E]">Integration status for analytics and search visibility. IDs remain environment configuration rather than database data.</p>
          </div>
          <form action={logoutAdmin}><button type="submit" className="rounded border border-[#D8D8D3] px-4 py-2 text-sm font-medium hover:bg-white">Sign out</button></form>
        </header>
        <nav className="mt-6 flex flex-wrap gap-2">
          <Link href="/admin/health" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Health</Link>
          <Link href="/admin/import" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Import</Link>
          <Link href="/admin/catalog" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Supplier catalog</Link>
          <Link href="/admin/review" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Match review</Link>
          <Link href="/products" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium">Storefront</Link>
        </nav>
        <section className="mt-8 grid gap-4">
          {integrations.map(([name, description, env, configured]) => (
            <article key={name} className="rounded-2xl border border-[#E3E3DF] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h2 className="text-lg font-black">{name}</h2><p className="mt-2 text-sm leading-6 text-[#6B6B6E]">{description}</p></div>
                <Status configured={configured} />
              </div>
              <div className="mt-5 rounded-xl bg-[#F7F7F5] px-4 py-3 font-mono text-xs text-[#55555A]">{env}</div>
            </article>
          ))}
        </section>
        <section className="mt-8 rounded-2xl border border-[#E3E3DF] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black">Measurement events prepared</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {['view_item', 'search', 'begin_checkout', 'purchase'].map((event) => <div key={event} className="rounded-xl bg-[#F7F7F5] p-4"><div className="font-mono text-xs font-bold text-[#2F6B4F]">{event}</div><div className="mt-1 text-xs text-[#6B6B6E]">GA4 ecommerce measurement</div></div>)}
          </div>
        </section>
      </div>
    </main>
  )
}
