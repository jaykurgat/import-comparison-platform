'use client'

import { useEffect } from 'react'
import { trackSearch } from '@/lib/analytics/events'

export default function SearchTracker({ query }: { query: string }) {
  useEffect(() => {
    trackSearch(query)
  }, [query])
  return null
}
