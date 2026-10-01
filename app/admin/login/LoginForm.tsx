'use client'

import { useState } from 'react'
import { loginAdmin } from '../actions'

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M2.7 12s3.3-5.2 9.3-5.2S21.3 12 21.3 12 18 17.2 12 17.2 2.7 12 2.7 12Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="m3 3 18 18M10.6 6.9A9.8 9.8 0 0 1 12 6.8c6 0 9.3 5.2 9.3 5.2a17 17 0 0 1-3.1 3.5M6.1 6.9C3.9 8.4 2.7 12 2.7 12s3.3 5.2 9.3 5.2c1.4 0 2.6-.3 3.7-.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LoginForm({ error }: { error?: boolean }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={loginAdmin} className="mt-8 space-y-5">
      {error && (
        <div role="alert" className="border border-[#E8B7A9] bg-[#FFF7F4] px-4 py-3 text-sm text-[#9B3F2B]">
          The email or password is incorrect. Please check your details and try again.
        </div>
      )}

      <label className="block">
        <span className="text-sm font-semibold text-[#222623]">Email address</span>
        <input name="email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required className="mt-2 h-12 w-full border border-[#D2D6D1] bg-white px-3.5 text-[15px] text-[#171B18] outline-none transition-colors placeholder:text-[#9A9F9B] focus:border-[#123F2B] focus:ring-2 focus:ring-[#123F2B]/10" placeholder="admin@kijicart.com" />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-[#222623]">Password</span>
        <span className="relative mt-2 block">
          <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="h-12 w-full border border-[#D2D6D1] bg-white px-3.5 pr-12 text-[15px] text-[#171B18] outline-none transition-colors placeholder:text-[#9A9F9B] focus:border-[#123F2B] focus:ring-2 focus:ring-[#123F2B]/10" placeholder="Enter your password" />
          <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#68716B] transition-colors hover:text-[#123F2B] focus:outline-none">
            <EyeIcon hidden={!showPassword} />
          </button>
        </span>
      </label>

      <button type="submit" className="h-12 w-full bg-[#123F2B] px-4 text-sm font-bold text-white transition-colors hover:bg-[#0D3021] focus:outline-none focus:ring-2 focus:ring-[#123F2B]/30 focus:ring-offset-2">Sign in to KijijiCart</button>
    </form>
  )
}
