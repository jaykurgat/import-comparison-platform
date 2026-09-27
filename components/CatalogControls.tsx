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
    <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
      <label className="flex shrink-0 items-center gap-2 text-xs font-bold text-slate-500">
        Sort
        <select
          defaultValue={sort}
          onChange={(event) => submit(event.target.value as CatalogSort)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-[#f5a400] hover:bg-[#fffaf0] focus:border-[#123f2b] focus:ring-2 focus:ring-[#f5a400]/40"
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
