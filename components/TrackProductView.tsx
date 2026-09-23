'use client'

import { useEffect } from 'react'
import { trackViewItem } from '@/lib/analytics/events'

export default function TrackProductView({ sku, title, price, currency, category }: { sku: string; title: string; price: number; currency: string; category?: string | null }) {
  useEffect(() => {
    trackViewItem({ item_id: sku, item_name: title, price, currency, item_category: category ?? undefined })
  }, [sku, title, price, currency, category])
  return null
}
