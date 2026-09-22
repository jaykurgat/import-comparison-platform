import Link from 'next/link'

export default function ImportCheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-[#f5f6f7] px-4 py-16 text-slate-950">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-[#0f5132]">Payment received</div>
        <h1 className="mt-3 text-3xl font-black">Your import order is being processed</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          We received your payment. The supplier order is submitted only after the payment webhook confirms the funds, so closing this page will not interrupt fulfillment.
        </p>
        <Link href="/products" className="mt-6 inline-flex rounded-lg bg-[#0f5132] px-5 py-3 text-sm font-bold text-white">
          Continue shopping
        </Link>
      </div>
    </main>
  )
}
