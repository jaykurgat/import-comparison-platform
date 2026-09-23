export const dynamic = 'force-dynamic'

import { getImportCatalog } from '@/lib/admin/getImportCatalog'
import { requireAdmin } from '@/lib/admin/auth'
import { logoutAdmin } from '../actions'
import { runCatalogReprice, runCatalogSync } from './actions'
import { PublishToggle } from './PublishToggle'
import { SyncButton } from './SyncButton'

export default async function CatalogAdminPage() {
  await requireAdmin()
  const catalog = await getImportCatalog()

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-6 py-10 text-[#1C1C1E]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-[#E3E3DF] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Import Catalog</h1>
            <p className="mt-1 text-sm text-[#6B6B6E]">
              {catalog.length} persisted supplier SKU{catalog.length === 1 ? '' : 's'}.
              Supplier stock is synchronized from AliExpress and is not manually overridden here.
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

        <div className="mb-4 flex flex-wrap gap-2">
          <a href="/admin" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F7F5]">Dashboard</a>
          <a href="/admin/health" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F7F5]">Health</a>
        </div>
        <div className="mt-6 overflow-x-auto rounded-lg border border-[#E3E3DF] bg-white">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b border-[#E3E3DF] bg-[#FAFAF9] text-left text-xs uppercase tracking-wide text-[#8A8A8E]">
              <tr>
                <th className="px-4 py-3">Product / variant</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Landed</th>
                <th className="px-4 py-3">Sell</th>
                <th className="px-4 py-3">Price data</th>
                <th className="px-4 py-3">Storefront</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E3DF]">
              {catalog.map((item) => (
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
                        <div className="mt-1 text-xs text-[#8A8A8E]">
                          {item.price.priceDataAsOf.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#8A8A8E]">Not priced</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <PublishToggle id={item.id} published={item.isPublished} canPublish={Boolean(item.price) && !item.price?.isStale && Boolean(item.title.trim()) && Boolean(item.imageUrl)} />
                  </td>
                </tr>
              ))}
              {catalog.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#6B6B6E]">
                    No supplier SKUs yet. Run a catalog sync after local products have been ingested.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
