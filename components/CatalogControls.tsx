'use client'

import { useEffect, useState } from 'react'

export type CatalogSort = 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name'

export default function CatalogControls({
  query,
  categoryId,
  source,
  sort,
}: {
  query: string
  categoryId: string
  source: string
  sort: CatalogSort
}) {
  const [value, setValue] = useState(sort)

  useEffect(() => setValue(sort), [sort])

  function submit(nextSort: CatalogSort) {
    setValue(nextSort)
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (categoryId) params.set('category', categoryId)
    if (source && source !== 'all') params.set('source', source)
    if (nextSort !== 'featured') params.set('sort', nextSort)
    window.location.assign(`/products?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2 overflow-x-auto">
        {[
          ['all', 'All'],
          ['local', 'Local'],
          ['import', 'Direct import'],
          ['deals', 'Import comparisons'],
        ].map(([key, label]) => {
          const active = source === key || (key === 'all' && !source)
          const params = new URLSearchParams()
          if (query) params.set('q', query)
          if (categoryId) params.set('category', categoryId)
          if (key !== 'all') params.set('source', key)
          if (sort !== 'featured') params.set('sort', sort)
          const href = `/products?${params.toString()}`
          return (
            <a
              key={key}
              href={href}
              className={`whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-black transition ${active ? 'bg-[#123f2b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {label}
            </a>
          )
        })}
      </div>

      <label className="flex shrink-0 items-center gap-2 text-xs font-bold text-slate-500">
        Sort
        <select
          value={value}
          onChange={(event) => submit(event.target.value as CatalogSort)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#123f2b]"
          aria-label="Sort products"
        >
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name: A–Z</option>
        </select>
      </label>
    </div>
  )
}
