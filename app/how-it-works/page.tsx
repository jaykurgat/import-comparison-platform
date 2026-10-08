export const dynamic = 'force-dynamic'

import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main className="kc-page min-h-screen bg-[#f7f7f3] text-slate-950">
        <div className="mx-auto max-w-[1040px] px-4 py-6 sm:px-6 sm:py-10 lg:py-14">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">About KijijiCart</p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">How KijijiCart works</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              KijijiCart is a shopping marketplace first. Local listings stay in the catalog, while supplier information can add direct-import options and price comparisons where the underlying data is available.
            </p>

            <div className="mt-7 grid gap-3 sm:mt-9 sm:grid-cols-2 sm:gap-4">
              {[
                ['Shop the catalog', 'Browse products, categories and current prices. A product does not disappear simply because no supplier match has been found.'],
                ['Compare when data supports it', 'Some local products have a linked import alternative. Those comparisons use the persisted supplier price and the available landed-cost inputs.'],
                ['Choose how to buy', 'A local product can remain a normal local purchase. A published direct-import listing can continue to its supplier checkout path when stock and pricing are available.'],
                ['Review the product before checkout', 'Supplier stock, variant selection, pricing and delivery inputs can change. Product detail pages keep the exact supplier variant visible before checkout.'],
              ].map(([title, body]) => (
                <section key={title} className="rounded-2xl border border-slate-200 bg-[#fafaf7] p-4 sm:p-5">
                  <h2 className="text-base font-black text-slate-900">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
                </section>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/products" className="rounded-xl bg-[#123f2b] px-5 py-3 text-sm font-black text-white hover:bg-[#0d3021]">Shop products →</Link>
              <Link href="/" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:border-slate-300">Back home</Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
