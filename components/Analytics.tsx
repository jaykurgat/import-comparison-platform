'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export default function Analytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const [consent, setConsent] = useState<'granted' | 'denied' | 'unset'>('unset')

  useEffect(() => {
    const sync = () => {
      const value = window.localStorage.getItem('kijijicart_analytics_consent')
      setConsent(value === 'granted' || value === 'denied' ? value : 'unset')
    }
    sync()
    window.addEventListener('kijijicart-consent-change', sync)
    return () => window.removeEventListener('kijijicart-consent-change', sync)
  }, [])

  if (!measurementId || consent !== 'granted') return null

  const configScript = [
    'window.dataLayer = window.dataLayer || [];',
    'window.gtag = function(){window.dataLayer.push(arguments);}',
    "window.gtag('js', new Date());",
    "window.gtag('config', '" + measurementId + "', { anonymize_ip: true });",
  ].join('\n')

  return (
    <>
      <Script src={'https://www.googletagmanager.com/gtag/js?id=' + measurementId} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">{configScript}</Script>
    </>
  )
}
