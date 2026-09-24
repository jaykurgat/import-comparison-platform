import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f7f7f3] text-slate-950">
        <div className="mx-auto max-w-[980px] px-4 py-10 sm:px-6 lg:py-16">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">About KijijiCart</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">How KijijiCart works</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              KijijiCart is a shopping marketplace first. Local listings stay in the catalog, while supplier information can add direct-import options and price comparisons where the underlying data is available.
            </p>

            <div className="mt-10 space-y-6">
              {[
                ['Shop the catalog', 'Browse products, categories and current prices. A product does not disappear simply because no supplier match has been found.'],
                ['Compare when data supports it', 'Some local products have a linked import alternative. Those comparisons use the persisted supplier price and the available landed-cost inputs.'],
                ['Choose how to buy', 'A local product can remain a normal local purchase. A published direct-import listing can continue to its supplier checkout path when stock and pricing are available.'],
                ['Review the product before checkout', 'Supplier stock, variant selection, pricing and delivery inputs can change. Product detail pages keep the exact supplier variant visible before checkout.'],
              ].map(([title, body]) => (
                <section key={title} className="rounded-2xl border border-slate-200 bg-[#fafaf7] p-6">
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
