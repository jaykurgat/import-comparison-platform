'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type ImportVariant = {
  skuId: string
  options: Record<string, string>
  imageUrl: string | null
  availableStock: number
  sellPrice: number
  currency: string
}

type OptionGroup = {
  name: string
  values: string[]
}

type ImportVariantContextValue = {
  variants: ImportVariant[]
  selectedVariant: ImportVariant | undefined
  selectedOptions: Record<string, string>
  optionGroups: OptionGroup[]
  fixedOptions: Array<{ name: string; value: string }>
  availableVariantCount: number
  selectOption: (name: string, value: string) => void
}

const Context = createContext<ImportVariantContextValue | null>(null)

function matchesOptions(variant: ImportVariant, selection: Record<string, string>, ignoredName?: string): boolean {
  return Object.entries(selection).every(([name, value]) => (
    name === ignoredName || !value || variant.options[name] === value
  ))
}

export function ImportVariantProvider({ variants, children }: { variants: ImportVariant[]; children: ReactNode }) {
  const initial = variants.find((variant) => variant.availableStock > 0) ?? variants[0]
  const [selectedSkuId, setSelectedSkuId] = useState(initial?.skuId ?? '')
  const selectedVariant = variants.find((variant) => variant.skuId === selectedSkuId) ?? initial

  const optionGroups = useMemo(() => {
    const names: string[] = []
    const seen = new Set<string>()

    for (const variant of variants) {
      for (const name of Object.keys(variant.options)) {
        const clean = name.trim()
        if (clean && !seen.has(clean)) {
          seen.add(clean)
          names.push(clean)
        }
      }
    }

    return names
      .map((name) => {
        const values = new Set<string>()
        for (const variant of variants) {
          const value = variant.options[name]
          if (value) values.add(value)
        }
        return { name, values: [...values] }
      })
      .filter((group) => group.values.length > 1)
  }, [variants])

  const fixedOptions = useMemo(() => {
    const groups = new Map<string, Set<string>>()

    for (const variant of variants) {
      for (const [name, value] of Object.entries(variant.options)) {
        const values = groups.get(name) ?? new Set<string>()
        if (value) values.add(value)
        groups.set(name, values)
      }
    }

    return [...groups.entries()]
      .filter(([, values]) => values.size === 1)
      .map(([name, values]) => ({ name, value: [...values][0] }))
  }, [variants])

  function selectOption(name: string, value: string) {
    const selection = { ...(selectedVariant?.options ?? {}), [name]: value }
    const available = variants.find((variant) => variant.availableStock > 0 && matchesOptions(variant, selection))
    const any = variants.find((variant) => matchesOptions(variant, selection))
    setSelectedSkuId(available?.skuId ?? any?.skuId ?? selectedSkuId)
  }

  return (
    <Context.Provider value={{
      variants,
      selectedVariant,
      selectedOptions: selectedVariant?.options ?? {},
      optionGroups,
      fixedOptions,
      availableVariantCount: variants.filter((variant) => variant.availableStock > 0).length,
      selectOption,
    }}>
      {children}
    </Context.Provider>
  )
}

export function useImportVariantContext(): ImportVariantContextValue {
  const context = useContext(Context)
  if (!context) throw new Error('useImportVariantContext must be used inside ImportVariantProvider')
  return context
}
