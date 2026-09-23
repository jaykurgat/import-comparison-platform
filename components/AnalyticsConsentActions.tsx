'use client'

export default function AnalyticsConsentActions({ onDone }: { onDone: () => void }) {
  function choose(value: 'granted' | 'denied') {
    window.localStorage.setItem('kijijicart_analytics_consent', value)
    window.dispatchEvent(new Event('kijijicart-consent-change'))
    onDone()
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" onClick={() => choose('granted')} className="rounded-xl bg-[#123f2b] px-4 py-2.5 text-xs font-black text-white">Allow analytics</button>
      <button type="button" onClick={() => choose('denied')} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700">Not now</button>
    </div>
  )
}
