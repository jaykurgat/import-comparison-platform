import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="mt-12 bg-[#10261d] text-slate-300 sm:mt-16">
      <div className="mx-auto grid max-w-[1440px] gap-7 px-4 py-9 sm:px-6 sm:py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="text-xl font-black tracking-[-0.05em] text-white sm:text-2xl">
            Kijiji<span className="text-[#ff9900]">Cart</span>
          </div>
          <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400 sm:mt-3 sm:text-sm sm:leading-6">
            A Kenyan marketplace for local products and direct import options.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.12em] text-white">Shop</h3>
          <div className="mt-3 space-y-2.5 text-sm">
            <Link className="block hover:text-white" href="/products">All products</Link>
            <Link className="block hover:text-white" href="/products?source=deals">Deals</Link>
            <Link className="block hover:text-white" href="/products?source=import">Direct imports</Link>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.12em] text-white">About KijijiCart</h3>
          <div className="mt-3 space-y-2.5 text-sm">
            <Link className="block hover:text-white" href="/how-it-works">How it works</Link>
            <Link className="block hover:text-white" href="/products">Shop by category</Link>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.12em] text-white">Need help?</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Product availability, supplier prices and delivery costs can change. Review the product details before purchasing.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-4 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} KijijiCart. All rights reserved.</span>
          <span>Prices shown in KES where a local/import selling price is available.</span>
        </div>
      </div>
    </footer>
  )
}