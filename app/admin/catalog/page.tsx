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
import { PublishToggle } from './PublishToggle'
import { BatchPriceUpdateButton } from './BatchPriceUpdateButton'
import { SyncButton } from './SyncButton'
import { CategoryEditor } from './CategoryEditor'
import { prisma } from '@/lib/prisma'

const PAGE_SIZES = [20, 30, 50]

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
      select: { id: true, name: true, parent: { select: { name: true } } },
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

        <div className="mt-4 overflow-x-auto rounded-lg border border-[#E3E3DF] bg-white">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b border-[#E3E3DF] bg-[#FAFAF9] text-left text-xs uppercase tracking-wide text-[#8A8A8E]">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Landed</th>
                <th className="px-4 py-3">Sell</th>
                <th className="px-4 py-3">Price data</th>
                <th className="px-4 py-3">Storefront</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E3DF]">
              {catalog.rows.map((item) => (
                <tr key={item.id} className="align-middle">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-[#F0F0EC]" />
                      )}
                      <div className="max-w-sm">
                        <div className="font-medium leading-snug">{item.title}</div>
                        <div className="mt-1 text-xs text-[#8A8A8E]">
                          {item.productId} · SKU {item.skuId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <CategoryEditor
                      skuId={item.id}
                      categoryId={item.categoryId}
                      categories={categories.map((category) => ({
                        id: category.id,
                        name: category.name,
                        parentName: category.parent?.name ?? null,
                      }))}
                    />
                  </td>
                  <td className="px-4 py-4 tabular-nums">
                    {item.currency} {item.itemPrice.toFixed(2)}
                    <div className="mt-1 text-xs text-[#8A8A8E]">{item.shipFromCountry ?? '—'}</div>
                  </td>
                  <td className="px-4 py-4 tabular-nums">{item.stock}</td>
                  <td className="px-4 py-4 tabular-nums">
                    {item.price ? `${item.price.currency} ${item.price.landed.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-4 font-medium tabular-nums">
                    {item.price ? `${item.price.currency} ${item.price.sell.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-4">
                    {item.price ? (
                      <div>
                        <span className={item.price.isStale ? 'font-medium text-[#A6432D]' : 'text-[#2F6B4F]'}>
                          {item.price.isStale ? 'Stale' : 'Current'}
                        </span>
                        <div className="mt-1 text-xs text-[#8A8A8E]">{item.price.priceDataAsOf.toLocaleString()}</div>
                      </div>
                    ) : (
                      <span className="text-[#8A8A8E]">Not priced</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <PublishToggle
                      id={item.id}
                      published={item.isPublished}
                      canPublish={Boolean(item.price) && !item.price?.isStale && Boolean(item.title.trim()) && Boolean(item.imageUrl)}
                    />
                  </td>
                </tr>
              ))}
              {catalog.rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#6B6B6E]">
                    {search
                      ? `No supplier products match “${search}”.`
                      : 'No supplier products yet. Run a catalog sync after local products have been ingested.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
