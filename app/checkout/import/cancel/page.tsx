import Link from 'next/link'

export default function ImportCheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-[#f5f6f7] px-4 py-16 text-slate-950">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Checkout cancelled</div>
        <h1 className="mt-3 text-3xl font-black">No payment was taken</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Your supplier order was not submitted. You can return to the catalog and start checkout again when you are ready.
        </p>
        <Link href="/products" className="mt-6 inline-flex rounded-lg bg-[#0f5132] px-5 py-3 text-sm font-bold text-white">
          Return to products
        </Link>
      </div>
    </main>
  )
}
