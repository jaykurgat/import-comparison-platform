import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="mt-16 bg-[#10261d] text-slate-300">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="text-2xl font-black tracking-[-0.05em] text-white">Kijiji<span className="text-amber-400">Cart</span></div>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
            A Kenyan marketplace for local products and direct import options.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-black text-white">Shop</h3>
          <div className="mt-4 space-y-3 text-sm">
            <Link className="block hover:text-white" href="/products">All products</Link>
            <Link className="block hover:text-white" href="/products?source=deals">Comparisons</Link>
            <Link className="block hover:text-white" href="/products?source=import">Direct imports</Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black text-white">About KijijiCart</h3>
          <div className="mt-4 space-y-3 text-sm">
            <Link className="block hover:text-white" href="/how-it-works">How it works</Link>
            <Link className="block hover:text-white" href="/products">Shop by category</Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black text-white">Need help?</h3>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Product availability, supplier prices and delivery costs can change. Review the product details before purchasing.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} KijijiCart. All rights reserved.</span>
          <span>Prices shown in KES where a local/import selling price is available.</span>
        </div>
      </div>
    </footer>
  )
}
