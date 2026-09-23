import { loginAdmin } from '../actions'
import Link from 'next/link'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-6 py-16 text-[#1C1C1E]">
      <div className="mx-auto max-w-sm">
        <div className="rounded-xl border border-[#E3E3DF] bg-white p-7 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2F6B4F]">Admin</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-[#6B6B6E]">Catalog and product-match administration.</p>

          {params.error && (
            <p className="mt-5 rounded-lg bg-[#FFF4F1] px-3 py-2 text-sm text-[#A6432D]">
              Invalid admin password.
            </p>
          )}

          <form action={loginAdmin} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-2 w-full rounded-lg border border-[#D8D8D3] px-3 py-2.5 outline-none focus:border-[#2F6B4F]"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#2F6B4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#25573F]"
            >
              Sign in
            </button>
          </form>
        </div>
        <Link href="/products" className="mt-4 block text-center text-sm text-[#6B6B6E] hover:text-[#2F6B4F]">
          Back to storefront
        </Link>
      </div>
    </main>
  )
}
