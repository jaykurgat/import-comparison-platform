export const dynamic = 'force-dynamic'

import { getImportCatalog } from '@/lib/admin/getImportCatalog'
import { requireAdmin } from '@/lib/admin/auth'
import { logoutAdmin } from '../actions'
import {
  runCatalogReprice,
  runCatalogSync,
  runManualSupplierPriceUpdate,
  getManualSupplierPriceUpdateTotal,
} from './actions'
import { CatalogTable } from './CatalogTable'
import { BatchPriceUpdateButton } from './BatchPriceUpdateButton'
import { SyncButton } from './SyncButton'
import { prisma } from '@/lib/prisma'

const PAGE_SIZES = [20, 30, 50]

function getCategoryPath(id: string, categories: Array<{ id: string; name: string; parentId: string | null }>) {
  const byId = new Map(categories.map((category) => [category.id, category]))
  const parts: string[] = []
  const seen = new Set<string>()
  let current = byId.get(id)
  while (current && !seen.has(current.id)) {
    seen.add(current.id); parts.unshift(current.name)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return parts.join(' / ')
}

export default async function CatalogAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; search?: string }>
}) {
  await requireAdmin()

  const params = await searchParams
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)
  const pageSize = PAGE_SIZES.includes(Number.parseInt(params.pageSize ?? '30', 10))
    ? Number.parseInt(params.pageSize ?? '30', 10)
    : 30
  const search = params.search?.trim() ?? ''

  const [catalog, categories] = await Promise.all([
    getImportCatalog(page, pageSize, search),
    prisma.category.findMany({
      select: { id: true, name: true, parentId: true },
      orderBy: { name: 'asc' },
    }),
  ])

  function pageHref(nextPage: number, nextPageSize = catalog.pageSize) {
    const query = new URLSearchParams({
      page: String(nextPage),
      pageSize: String(nextPageSize),
    })
    if (search) query.set('search', search)
    return `/admin/catalog?${query.toString()}`
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-6 py-10 text-[#1C1C1E]">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-[#E3E3DF] pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Supplier Catalog</h1>
              <p className="mt-1 text-sm text-[#6B6B6E]">
                {catalog.total.toLocaleString()} supplier SKU{catalog.total === 1 ? '' : 's'}.
                Showing {catalog.rows.length ? (catalog.page - 1) * catalog.pageSize + 1 : 0}–
                {(catalog.page - 1) * catalog.pageSize + catalog.rows.length}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href="/admin/catalog/add" className="rounded bg-[#123F2B] px-4 py-2 text-sm font-bold text-white hover:bg-[#0D3021]">
                Add AliExpress product
              </a>
              <SyncButton action={runCatalogSync} label="Sync supplier catalog" />
              <SyncButton action={runCatalogReprice} label="Reprice catalog" />
              <form action={logoutAdmin}>
                <button type="submit" className="rounded border border-[#D8D8D3] px-4 py-2 text-sm font-medium hover:bg-[#F7F7F5]">
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <div className="mt-4">
            <BatchPriceUpdateButton
              action={runManualSupplierPriceUpdate}
              totalAction={getManualSupplierPriceUpdateTotal}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form method="get" className="flex w-full max-w-2xl items-center gap-2">
            <input type="hidden" name="pageSize" value={String(catalog.pageSize)} />
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search by product name, SKU, or AliExpress ID"
              aria-label="Search supplier catalog"
              className="min-w-0 flex-1 border border-[#D8D8D3] bg-white px-3 py-2 text-sm outline-none transition placeholder:text-[#A0A09B] hover:border-[#F5A400] focus:border-[#123F2B] focus:ring-2 focus:ring-[#F5A400]/30"
            />
            <button
              type="submit"
              className="border border-[#123F2B] bg-[#123F2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D3021]"
            >
              Search
            </button>
            {search && (
              <a
                href={pageHref(1)}
                className="border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium hover:border-[#F5A400] hover:bg-[#FFF4D6]"
              >
                Clear
              </a>
            )}
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
          <div className="flex flex-wrap gap-2">
            <a href="/admin" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F7F5]">Dashboard</a>
            <a href="/admin/health" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F7F5]">Health</a>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#6B6B6E]">Rows:</span>
            {PAGE_SIZES.map((size) => (
              <a
                key={size}
                href={pageHref(1, size)}
                className={`border px-3 py-1.5 text-sm font-medium ${catalog.pageSize === size ? 'border-[#123F2B] bg-[#123F2B] text-white' : 'border-[#D8D8D3] bg-white hover:bg-[#F7F7F5]'}`}
              >
                {size}
              </a>
            ))}
          </div>
          </div>
        </div>

        <div className="mt-4">
          <CatalogTable
            rows={catalog.rows}
            categories={categories.map((category) => ({
              id: category.id,
              name: category.name,
              path: getCategoryPath(category.id, categories),
            }))}
          />
        </div>

        {catalog.totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-[#6B6B6E]">
              Page {catalog.page} of {catalog.totalPages}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <a
                href={pageHref(Math.max(1, catalog.page - 1))}
                aria-disabled={catalog.page === 1}
                className={catalog.page === 1 ? 'pointer-events-none border border-[#E3E3DF] px-3 py-1.5 text-sm text-[#B8B8B4]' : 'border border-[#D8D8D3] bg-white px-3 py-1.5 text-sm hover:bg-[#F7F7F5]'}
              >
                Previous
              </a>
              {Array.from({ length: Math.min(7, catalog.totalPages) }, (_, index) => {
                const start = Math.min(
                  Math.max(1, catalog.page - 3),
                  Math.max(1, catalog.totalPages - 6),
                )
                return start + index
              }).filter((value) => value <= catalog.totalPages).map((value) => (
                <a
                  key={value}
                  href={pageHref(value)}
                  className={value === catalog.page ? 'border border-[#123F2B] bg-[#123F2B] px-3 py-1.5 text-sm font-medium text-white' : 'border border-[#D8D8D3] bg-white px-3 py-1.5 text-sm hover:bg-[#F7F7F5]'}
                >
                  {value}
                </a>
              ))}
              <a
                href={pageHref(Math.min(catalog.totalPages, catalog.page + 1))}
                aria-disabled={catalog.page === catalog.totalPages}
                className={catalog.page === catalog.totalPages ? 'pointer-events-none border border-[#E3E3DF] px-3 py-1.5 text-sm text-[#B8B8B4]' : 'border border-[#D8D8D3] bg-white px-3 py-1.5 text-sm hover:bg-[#F7F7F5]'}
              >
                Next
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
