'use client'

import { useEffect, useState } from 'react'
import AnalyticsConsentActions from './AnalyticsConsentActions'

export default function AnalyticsConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!window.localStorage.getItem('kijijicart_analytics_consent'))
  }, [])

  if (!visible) return null

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5">
      <p className="text-sm font-black text-slate-950">Help us improve KijijiCart</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">We use Google Analytics to understand visits and shopping activity. Analytics is optional.</p>
      <AnalyticsConsentActions onDone={() => setVisible(false)} />
    </aside>
  )
}
