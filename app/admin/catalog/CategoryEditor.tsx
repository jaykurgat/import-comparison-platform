'use client'

import { useState, useTransition } from 'react'
import { updateImportSkuCategory } from './actions'

export interface CategoryOption {
  id: string
  name: string
  path: string
}

export function CategoryEditor({ skuId, categoryId, categories }: { skuId: string; categoryId: string | null; categories: CategoryOption[] }) {
  const [value, setValue] = useState(categoryId ?? '')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  function save(nextValue: string) {
    setValue(nextValue)
    setMessage('')
    startTransition(async () => {
      try {
        await updateImportSkuCategory(skuId, nextValue || null)
        setMessage('Saved')
      } catch (error) {
        setValue(categoryId ?? '')
        setMessage(error instanceof Error ? error.message : 'Could not save category.')
      }
    })
  }

  return (
    <div className="min-w-[190px]">
      <select value={value} disabled={isPending} onChange={(event) => save(event.target.value)} aria-label="Change product category" className="w-full border border-[#D8D8D3] bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-[#F5A400] focus:border-[#123F2B] focus:ring-2 focus:ring-[#F5A400]/30 disabled:opacity-60">
        <option value="">Not resolved</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.path}
          </option>
        ))}
      </select>
      <div className="mt-1 min-h-4 text-[10px] text-slate-400" aria-live="polite">
        {isPending ? 'Saving…' : message}
      </div>
    </div>
  )
}
