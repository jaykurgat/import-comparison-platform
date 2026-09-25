'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type CartItem = {
  key: string
  kind: 'local' | 'supplier'
  title: string
  imageUrl: string | null
  price: number
  currency: string
  quantity: number
  availableStock: number
  sku: string
  productId?: string
  skuId?: string
  options: Record<string, string>
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: CartItem) => void
  updateQuantity: (key: string, quantity: number) => void
  removeItem: (key: string) => void
  clear: () => void
}

const STORAGE_KEY = 'kijijicart_cart_v1'
const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw) as CartItem[])
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem(item) {
      setItems((current) => {
        const existing = current.find((entry) => entry.key === item.key)
        if (!existing) return [...current, item]
        return current.map((entry) => entry.key === item.key
          ? { ...entry, quantity: Math.min(entry.availableStock, entry.quantity + item.quantity) }
          : entry)
      })
    },
    updateQuantity(key, quantity) {
      setItems((current) => current.map((item) => item.key === key
        ? { ...item, quantity: Math.max(1, Math.min(item.availableStock, quantity)) }
        : item))
    },
    removeItem(key) {
      setItems((current) => current.filter((item) => item.key !== key))
    },
    clear() {
      setItems([])
    },
  }), [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used inside CartProvider')
  return value
}
