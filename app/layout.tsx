import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Analytics from '@/components/Analytics'
import AnalyticsConsent from '@/components/AnalyticsConsent'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KijijiCart — Compare local and imported prices',
  description: 'Shop and compare Kenyan retail products with landed import alternatives.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const verification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  return (
    <html lang="en" className={geistSans.variable + ' ' + geistMono.variable + ' antialiased'}>
      <head>{verification && <meta name="google-site-verification" content={verification} />}</head>
      <body className="min-h-screen bg-[#f5f6f7]">
        {children}
        <Analytics />
        <AnalyticsConsent />
      </body>
    </html>
  )
}
