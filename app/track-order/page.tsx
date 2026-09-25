'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Shipment = {
  id: string
  carrier: string | null
  trackingNumber: string | null
  shippingMethod: string | null
  currentStatus: string
  currentRawStatus: string | null
  shippedAt: string | null
  deliveredAt: string | null
  lastSyncedAt: string | null
  events: Array<{
    id: string
    status: string
    rawStatus: string | null
    description: string | null
    location: string | null
    eventDate: string
  }>
}

const labels: Record<string, string> = {
  PENDING: 'Preparing shipment',
  LABEL_CREATED: 'Shipping label created',
  IN_TRANSIT: 'In transit',
  ARRIVED_DESTINATION: 'Arrived at destination',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  EXCEPTION: 'Delivery exception',
  CANCELLED: 'Cancelled',
  UNKNOWN: 'Tracking update',
}

function formatDate(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function TrackOrderPage() {
  const [orderStatus, setOrderStatus] = useState('LOADING')
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const params = useMemo(() => new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search), [])
  const orderId = params.get('orderId')
  const token = params.get('token')

  async function load() {
    if (!orderId || !token) {
      setError('This tracking link is incomplete.')
      return
    }

    try {
      const response = await fetch('/api/checkout/import/status?orderId=' + encodeURIComponent(orderId) + '&token=' + encodeURIComponent(token), { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Unable to load order tracking.')
      setOrderStatus(body.status ?? 'UNKNOWN')
      setShipments(body.shipments ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load order tracking.')
    }
  }

  async function refreshTracking() {
    if (!orderId || !token) return
    setRefreshing(true)
    try {
      await fetch('/api/checkout/import/tracking', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId, token }),
      })
    } finally {
      await load()
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!orderId || !token) {
      setError('This tracking link is incomplete.')
      return
    }

    void (async () => {
      try {
        const response = await fetch('/api/checkout/import/status?orderId=' + encodeURIComponent(orderId) + '&token=' + encodeURIComponent(token), { cache: 'no-store' })
        const body = await response.json()
        if (!response.ok) throw new Error(body.error ?? 'Unable to load order tracking.')
        setOrderStatus(body.status ?? 'UNKNOWN')
        setShipments(body.shipments ?? [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load order tracking.')
      }
    })()
  }, [orderId, token])

  return (
    <main className="min-h-screen bg-[#f7f7f3] px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/products" className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800 hover:underline">KijijiCart</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Order tracking</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Where is my order?</h1>
            {orderId && <p className="mt-1 text-sm text-slate-500">Order {orderId}</p>}
          </div>
          <button type="button" onClick={() => void refreshTracking()} disabled={refreshing || !orderId || !token} className="rounded-sm bg-[#123f2b] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">
            {refreshing ? 'Refreshing…' : 'Refresh tracking'}
          </button>
        </div>

        {error ? (
          <div className="mt-6 rounded-sm border border-red-200 bg-white p-5 text-sm font-bold text-red-700">{error}</div>
        ) : (
          <div className="mt-7 space-y-5">
            <section className="rounded-sm bg-white p-5 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">KijijiCart order</div>
              <div className="mt-2 text-lg font-black">{orderStatus === 'SUBMITTED' ? 'Order submitted to supplier' : orderStatus}</div>
              <p className="mt-1 text-sm text-slate-500">Shipment information is updated automatically as AliExpress provides new logistics data.</p>
            </section>

            {shipments.length === 0 ? (
              <section className="rounded-sm bg-white p-5 shadow-sm">
                <div className="text-sm font-black">Tracking is being prepared</div>
                <p className="mt-1 text-sm text-slate-500">The supplier has not returned a shipment record yet. Check again after the order is processed.</p>
              </section>
            ) : shipments.map((shipment, index) => (
              <section key={shipment.id} className="rounded-sm bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Shipment {index + 1}</div>
                    <div className="mt-1 text-xl font-black">{labels[shipment.currentStatus] ?? 'Tracking update'}</div>
                  </div>
                  {shipment.carrier && <div className="text-sm font-bold text-slate-600">{shipment.carrier}</div>}
                </div>

                <div className="grid gap-3 py-4 sm:grid-cols-2">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tracking number</div>
                    <div className="mt-1 text-sm font-black break-all">{shipment.trackingNumber ?? 'Not available yet'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Last checked</div>
                    <div className="mt-1 text-sm font-bold text-slate-700">{formatDate(shipment.lastSyncedAt) || 'Not checked yet'}</div>
                  </div>
                </div>

                <div className="space-y-0">
                  {shipment.events.map((event, eventIndex) => (
                    <div key={event.id} className="relative flex gap-3 py-3">
                      <div className="flex w-5 shrink-0 justify-center">
                        <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[#123f2b]" />
                        {eventIndex < shipment.events.length - 1 && <span className="absolute left-[9px] top-6 h-full w-px bg-slate-200" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black">{labels[event.status] ?? event.description ?? 'Tracking update'}</div>
                        {event.description && <div className="mt-0.5 text-xs leading-5 text-slate-500">{event.description}</div>}
                        {event.location && <div className="mt-0.5 text-xs font-bold text-slate-600">{event.location}</div>}
                        <div className="mt-1 text-[11px] text-slate-400">{formatDate(event.eventDate)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
