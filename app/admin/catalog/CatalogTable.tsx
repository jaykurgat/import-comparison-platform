'use client'

import { useMemo, useState, useTransition } from 'react'
import { bulkToggleImportPublished } from './actions'
import { PublishToggle } from './PublishToggle'
import { CategoryEditor, type CategoryOption } from './CategoryEditor'

type CatalogRow = {
  id: string
  productId: string
  skuId: string
  title: string
  imageUrl: string | null
  currency: string
  itemPrice: number
  stock: number
  isPublished: boolean
  shipFromCountry: string | null
  categoryId: string | null
  categoryName: string | null
  price: {
    landed: number
    sell: number
    markup: number
    currency: string
    isStale: boolean
    priceDataAsOf: Date
  } | null
}

export function CatalogTable({ rows, categories }: { rows: CatalogRow[]; categories: CategoryOption[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(row.id))
  const selectedRows = useMemo(() => rows.filter((row) => selected.includes(row.id)), [rows, selected])

  function toggleSelected(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  }

  function toggleAll() {
    setSelected(allSelected ? [] : rows.map((row) => row.id))
  }

  function bulkPublish(published: boolean) {
    setMessage('')
    startTransition(async () => {
      try {
        const result = await bulkToggleImportPublished(selected, published)
        setSelected([])
        setMessage(`${result.updated} SKU${result.updated === 1 ? '' : 's'} updated`)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not update selected SKUs.')
      }
    })
  }

  return (
    <>
      <div className="mb-2 flex min-h-8 items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 font-medium text-[#555]">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-3.5 w-3.5 accent-[#123F2B]" aria-label="Select all products on this page" />
            Select page
          </label>
          {selected.length > 0 && (
            <>
              <span className="text-[#999]">{selected.length} selected</span>
              <button type="button" disabled={pending} onClick={() => bulkPublish(true)} className="border border-[#123F2B] bg-[#123F2B] px-2.5 py-1 font-semibold text-white disabled:opacity-50">{pending ? 'Saving…' : 'Publish selected'}</button>
              <button type="button" disabled={pending} onClick={() => bulkPublish(false)} className="border border-[#D8D8D3] bg-white px-2.5 py-1 font-semibold text-[#333] hover:bg-[#F7F7F5] disabled:opacity-50">Unpublish selected</button>
              <button type="button" onClick={() => setSelected([])} className="px-2 py-1 text-[#777] hover:text-[#222]">Clear</button>
            </>
          )}
        </div>
        <div className="text-[#777]" aria-live="polite">{message}</div>
      </div>

      <div className="overflow-x-auto border border-[#DCDCD7] bg-white">
        <table className="w-full min-w-[900px] border-collapse text-[11px]">
          <thead className="sticky top-0 z-10 border-b border-[#DCDCD7] bg-[#F5F5F2] text-left font-semibold uppercase tracking-wide text-[#777]">
            <tr>
              <th className="w-8 px-2 py-2"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-3.5 w-3.5 accent-[#123F2B]" aria-label="Select all" /></th>
              <th className="px-2 py-2">Product</th>
              <th className="w-[180px] px-2 py-2">Category</th>
              <th className="px-2 py-2">Cost</th>
              <th className="px-2 py-2">Sell</th>
              <th className="px-2 py-2">Stock</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Supplier</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-b border-[#ECECE8] hover:bg-[#FBFBF9]">
                <td className="px-2 py-1.5 align-middle"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelected(item.id)} className="h-3.5 w-3.5 accent-[#123F2B]" aria-label={`Select ${item.title}`} /></td>
                <td className="max-w-[390px] px-2 py-1.5 align-middle">
                  <div className="flex min-w-0 items-center gap-2">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="h-8 w-8 shrink-0 object-cover" />
                    ) : <div className="h-8 w-8 shrink-0 bg-[#F0F0EC]" />}
                    <div className="min-w-0">
                      <div className="truncate font-medium text-[#222]" title={item.title}>{item.title}</div>
                      <div className="truncate text-[9px] text-[#999]" title={`${item.productId} · SKU ${item.skuId}`}>{item.productId} · {item.skuId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-1.5 align-middle"><CategoryEditor skuId={item.id} categoryId={item.categoryId} categories={categories} /></td>
                <td className="whitespace-nowrap px-2 py-1.5 align-middle tabular-nums text-[#555]">{item.price ? `${item.price.currency} ${item.price.landed.toLocaleString()}` : '—'}</td>
                <td className="whitespace-nowrap px-2 py-1.5 align-middle font-semibold tabular-nums text-[#123F2B]">{item.price ? `${item.price.currency} ${item.price.sell.toLocaleString()}` : '—'}</td>
                <td className="px-2 py-1.5 align-middle tabular-nums">{item.stock.toLocaleString()}</td>
                <td className="px-2 py-1.5 align-middle"><PublishToggle id={item.id} published={item.isPublished} canPublish={Boolean(item.price) && !item.price?.isStale && Boolean(item.title.trim()) && Boolean(item.imageUrl)} /></td>
                <td className="px-2 py-1.5 align-middle"><a href={`https://www.aliexpress.com/item/${item.productId}.html`} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-[10px] font-semibold text-[#123F2B] hover:text-[#F5A400]">Open ↗</a></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-[#777]">No products found.</td></tr>}
          </tbody>
        </table>
      </div>
      {selectedRows.length > 0 && <div className="mt-1 text-[10px] text-[#999]">Selected on this page: {selectedRows.length}</div>}
    </>
  )
}
