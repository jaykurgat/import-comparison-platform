'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { trackPurchase } from '@/lib/analytics/events'

export default function ImportCheckoutSuccessPage() {
  const [status, setStatus] = useState('PAYMENT_PENDING')
  const [message, setMessage] = useState('Waiting for the M-PESA payment confirmation…')
  const [orderTotal, setOrderTotal] = useState<number | null>(null)
  const [orderCurrency, setOrderCurrency] = useState('KES')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orderId = params.get('orderId')
    const accessToken = params.get('token')
    if (!orderId || !accessToken) return

    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const poll = async () => {
      try {
        const response = await fetch(`/api/checkout/import/status?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(accessToken)}`, {
          cache: 'no-store',
        })
        const body = await response.json()
        if (stopped) return

        setStatus(body.status ?? 'PAYMENT_PENDING')
        if (typeof body.customerTotal === 'number') setOrderTotal(body.customerTotal)
        if (typeof body.currency === 'string') setOrderCurrency(body.currency)
        if (body.payment?.status === 'PAID' && typeof body.customerTotal === 'number') {
          const key = `kijijicart_purchase_tracked_${orderId}`
          if (!window.localStorage.getItem(key)) {
            trackPurchase(orderId, body.items ?? [], body.customerTotal, body.currency ?? 'KES')
            window.localStorage.setItem(key, '1')
          }
        }
        if (body.status === 'SUBMITTED') {
          setMessage('Payment confirmed and your supplier order has been submitted.')
          return
        }
        if (body.status === 'SUBMITTING') {
          setMessage('Payment confirmed. Submitting your supplier order…')
          timer = setTimeout(poll, 2500)
          return
        }
        if (body.status === 'FAILED') {
          setMessage(body.errorMessage ?? 'Payment was received, but supplier order submission needs attention.')
          return
        }
        if (body.status === 'CANCELLED') {
          setMessage('The payment request expired or was cancelled.')
          return
        }

        setMessage(
          body.payment?.status === 'PAID'
            ? 'Payment confirmed. Submitting your supplier order…'
            : 'Waiting for the M-PESA payment confirmation…',
        )
        timer = setTimeout(poll, 2500)
      } catch {
        if (!stopped) {
          setMessage('Waiting for payment confirmation…')
          timer = setTimeout(poll, 4000)
        }
      }
    }

    void poll()
    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  return (
    <main className="min-h-screen bg-[#f5f6f7] px-4 py-16 text-slate-950">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-[#0f5132]">M-PESA checkout</div>
        <h1 className="mt-3 text-3xl font-black">
          {status === 'SUBMITTED' ? 'Your import order is confirmed' : 'Complete your M-PESA payment'}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">{message}</p>
        {orderTotal !== null && <p className="mt-3 text-sm font-bold text-slate-900">Order total: {orderCurrency} {orderTotal.toLocaleString()}</p>}
        <Link href="/products" className="mt-6 inline-flex rounded-lg bg-[#0f5132] px-5 py-3 text-sm font-bold text-white">
          Continue shopping
        </Link>
      </div>
    </main>
  )
}
