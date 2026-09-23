import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] px-6 py-16 text-[#1C1C1E]">
      <div className="max-w-md text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2F6B4F]">KijijiCart</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-[#6B6B6E]">The page you requested is no longer available or the address is incorrect.</p>
        <Link href="/products" className="mt-7 inline-flex rounded-lg bg-[#2F6B4F] px-5 py-3 text-sm font-semibold text-white hover:bg-[#25573F]">Browse products</Link>
      </div>
    </main>
  )
}
