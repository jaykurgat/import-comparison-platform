import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import Analytics from '@/components/Analytics'
import AnalyticsConsent from '@/components/AnalyticsConsent'
import { CartProvider } from '@/components/cart/CartProvider'

export const metadata: Metadata = {
  title: 'KijijiCart — Shop the marketplace',
  description: 'Shop products from one unified marketplace.'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const verification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  return (
    <html lang="en" className="antialiased">
      <head>{verification && <meta name="google-site-verification" content={verification} />}<link rel="icon" href="/kijijcart-mark.svg" /></head>
      <body className="min-h-screen bg-[#f5f6f7]">
        <CartProvider>{children}</CartProvider>
        <Analytics />
        <AnalyticsConsent />
      </body>
    </html>
  )
}
