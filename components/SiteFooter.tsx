import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="mt-16 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="text-xl font-black text-white">Kijiji<span className="text-[#f59e0b]">Cart</span></div>
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">A Kenyan shopping marketplace built around transparent local-versus-imported price comparisons.</p>
        </div>
        <div><h3 className="font-bold text-white">Shop</h3><div className="mt-3 space-y-2 text-sm"><Link className="block hover:text-white" href="/products">All products</Link><Link className="block hover:text-white" href="/products">Deals</Link></div></div>
        <div><h3 className="font-bold text-white">About</h3><div className="mt-3 space-y-2 text-sm"><Link className="block hover:text-white" href="/">How it works</Link><Link className="block hover:text-white" href="/">Price comparison</Link></div></div>
        <div><h3 className="font-bold text-white">Help</h3><p className="mt-3 text-sm leading-6 text-slate-400">Product availability and prices can change. Always review the product details before purchasing.</p></div>
      </div>
      <div className="border-t border-slate-800 px-4 py-5 text-center text-xs text-slate-500">© {new Date().getFullYear()} KijijiCart. All rights reserved.</div>
    </footer>
  )
}
