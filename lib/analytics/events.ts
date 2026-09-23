export interface AnalyticsItem {
  item_id: string
  item_name: string
  price?: number
  quantity?: number
  item_category?: string
  currency?: string
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function send(event: string, parameters: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', event, parameters)
}

export function trackViewItem(item: AnalyticsItem) {
  send('view_item', { currency: item.currency ?? 'KES', value: item.price ?? 0, items: [{ ...item, quantity: item.quantity ?? 1 }] })
}

export function trackSearch(searchTerm: string) {
  if (!searchTerm.trim()) return
  send('search', { search_term: searchTerm.trim() })
}

export function trackBeginCheckout(items: AnalyticsItem[], value: number, currency = 'KES') {
  send('begin_checkout', { currency, value, items })
}

export function trackPurchase(transactionId: string, items: AnalyticsItem[], value: number, currency = 'KES') {
  send('purchase', { transaction_id: transactionId, currency, value, items })
}
