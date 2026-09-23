'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep the production UI generic; server-side logging/observability can use
    // the framework's runtime logging without exposing internal details here.
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] px-6 py-16 text-[#1C1C1E]">
      <div className="max-w-md text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2F6B4F]">KijijiCart</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-[#6B6B6E]">We could not complete that request. Try again, or return to the storefront.</p>
        <div className="mt-7 flex justify-center gap-3">
          <button onClick={() => reset()} className="rounded-lg border border-[#D8D8D3] bg-white px-5 py-3 text-sm font-semibold hover:bg-[#F7F7F5]">Try again</button>
          <Link href="/products" className="rounded-lg bg-[#2F6B4F] px-5 py-3 text-sm font-semibold text-white hover:bg-[#25573F]">Browse products</Link>
        </div>
      </div>
    </main>
  )
}
