import Link from 'next/link'
import { LoginForm } from './LoginForm'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <main className="kc-admin min-h-screen bg-[#F7F7F3] text-[#171B18]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-10 sm:px-8">
        <div className="grid w-full overflow-hidden border border-[#DCE1DC] bg-white shadow-[0_18px_60px_rgba(18,63,43,0.08)] lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-[#123F2B] p-10 text-white lg:flex lg:min-h-[620px] lg:flex-col lg:justify-between xl:p-14">
            <div>
              <div className="inline-flex items-center border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold tracking-tight">KijijiCart</div>
              <p className="mt-20 max-w-md text-xs font-bold uppercase tracking-[0.22em] text-[#F4B942]">Store operations</p>
              <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-[1.08] tracking-tight xl:text-5xl">Your catalogue, orders and storefront in one place.</h1>
              <p className="mt-6 max-w-md text-[15px] leading-7 text-white/70">Secure access to the KijijiCart administration area.</p>
            </div>
            <p className="text-xs text-white/45">Private administration · KijijiCart</p>
          </section>

          <section className="flex min-h-[620px] flex-col justify-center p-7 sm:p-10 xl:p-14">
            <div className="mx-auto w-full max-w-md">
              <div className="lg:hidden">
                <div className="inline-flex border border-[#DCE1DC] bg-[#F7F7F3] px-3 py-2 text-sm font-bold tracking-tight text-[#123F2B]">KijijiCart</div>
              </div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#2F6B4F] lg:mt-0">Admin</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-[#68716B]">Sign in to manage your KijijiCart store.</p>

              <LoginForm error={Boolean(params.error)} />

              <Link href="/products" className="mt-7 block text-center text-sm font-medium text-[#68716B] transition-colors hover:text-[#123F2B]">← Back to storefront</Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
