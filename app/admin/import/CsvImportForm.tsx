'use client'

import { useActionState } from 'react'
import { importLocalCsv, type ImportState } from './actions'

const initialState: ImportState = { ok: true, message: '' }

const fields = [
  ['title', 'Product Name', true],
  ['price', 'Price', true],
  ['category', 'Category', false],
  ['sourceRef', 'SKU', false],
  ['sourceUrl', 'Product URL', false],
  ['description', 'Description', false],
  ['imageUrls', 'Image URLs', false],
  ['currency', 'Currency', false],
  ['inStock', 'In Stock', false],
  ['color', 'Color', false],
  ['size', 'Size', false],
] as const

export default function CsvImportForm() {
  const [state, formAction, pending] = useActionState(importLocalCsv, initialState)

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div className="rounded-lg border border-[#E3E3DF] bg-white p-5">
        <label className="block text-sm font-medium">CSV file</label>
        <input name="file" type="file" accept=".csv,text/csv" required className="mt-2 block w-full text-sm" />
        <p className="mt-2 text-xs text-[#6B6B6E]">Required fields: title and price. Category is optional; when present it is used as strong classification evidence.</p>
      </div>

      <div className="rounded-lg border border-[#E3E3DF] bg-white p-5">
        <h2 className="font-medium">Column mapping</h2>
        <p className="mt-1 text-xs text-[#6B6B6E]">Enter the exact CSV header for each field.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {fields.map(([name, placeholder, required]) => (
            <label key={name} className="text-sm">
              <span className="font-medium">{placeholder}{required ? ' *' : ''}</span>
              <input
                name={name}
                defaultValue={placeholder}
                required={required}
                className="mt-1 w-full rounded border border-[#D8D8D3] px-3 py-2 outline-none focus:border-[#2F6B4F]"
              />
            </label>
          ))}
        </div>
      </div>

      {state.message && (
        <div className={state.ok ? 'rounded-lg border border-[#B9D8C6] bg-[#F2F8F5] p-4 text-sm text-[#24553C]' : 'rounded-lg border border-[#E5B8AE] bg-[#FFF7F5] p-4 text-sm text-[#8B3524]'}>
          {state.message}
          {state.inserted !== undefined && <div className="mt-2">Accepted: {state.inserted} · Rejected: {state.rejected ?? 0}</div>}
        </div>
      )}

      <button disabled={pending} type="submit" className="rounded bg-[#2F6B4F] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {pending ? 'Importing…' : 'Import CSV'}
      </button>
    </form>
  )
}
