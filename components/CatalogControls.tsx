'use client'

import { useRouter } from 'next/navigation'

export type CatalogSort = 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name'

export default function CatalogControls({
  query,
  categoryId,
  sort,
}: {
  query: string
  categoryId: string
  sort: CatalogSort
}) {
  const router = useRouter()

  function submit(nextSort: CatalogSort) {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (categoryId) params.set('category', categoryId)
    if (nextSort !== 'featured') params.set('sort', nextSort)
    router.push('/products?' + params.toString())
  }

  return (
    <div className="flex flex-col gap-2 border-t border-[#e6ebe7] pt-4 sm:flex-row sm:items-center sm:justify-end">
      <label className="flex items-center justify-between gap-2 text-[11px] font-extrabold text-slate-500 sm:justify-start">
        Sort
        <select
          defaultValue={sort}
          onChange={(event) => submit(event.target.value as CatalogSort)}
          className="min-w-[150px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-[#f4b942] focus:border-[#123f2b] focus:ring-2 focus:ring-[#f4b942]/40"
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