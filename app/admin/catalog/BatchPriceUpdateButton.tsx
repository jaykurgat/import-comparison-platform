'use client'

import { useState } from 'react'

type BatchResult = {
  selectedProducts: number
  syncedProducts: number
  failedProducts: number
  repricedSkus: number
  changedSkus: number
  unavailableSkus: number
  errors: string[]
}

export function BatchPriceUpdateButton({
  action,
  totalAction,
}: {
  action: (beforeIso: string) => Promise<unknown>
  totalAction: (beforeIso: string) => Promise<number>
}) {
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [batchRunning, setBatchRunning] = useState(false)
  const [finished, setFinished] = useState(false)

  async function updateAllPrices() {
    setRunning(true)
    setMessage(null)
    setCompleted(0)
    setFinished(false)

    const beforeIso = new Date().toISOString()
    let products = 0
    let repriced = 0
    let changed = 0
    let unavailable = 0
    const errors: string[] = []

    try {
      const totalProducts = await totalAction(beforeIso)
      setTotal(totalProducts)

      if (totalProducts === 0) {
        setFinished(true)
        setMessage('All published supplier products are already up to date.')
        return
      }

      while (true) {
        setBatchRunning(true)
        setMessage(`Updating batch… ${products} of ${totalProducts} products completed.`)

        const result = (await action(beforeIso)) as BatchResult

        products += result.selectedProducts
        repriced += result.repricedSkus
        changed += result.changedSkus
        unavailable += result.unavailableSkus
        errors.push(...result.errors)

        setCompleted(Math.min(products, totalProducts))
        setBatchRunning(false)

        if (result.selectedProducts === 0 || result.syncedProducts === 0) break

        setMessage(
          `Batch complete — ${Math.min(products, totalProducts)} of ${totalProducts} products checked.`,
        )
      }

      setCompleted(totalProducts)
      setFinished(true)
      setMessage(
        errors.length
          ? `Finished: ${products} product(s) checked, ${repriced} SKU(s) repriced, ${changed} price change(s), ${unavailable} unavailable, ${errors.length} error(s).`
          : `Finished: ${products} product(s) checked, ${repriced} SKU(s) repriced, ${changed} price change(s).`,
      )
    } catch (error) {
      setBatchRunning(false)
      setMessage(error instanceof Error ? error.message : 'Price update failed.')
    } finally {
      setRunning(false)
    }
  }

  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0

  return (
    <div className="w-full border border-[#E3E3DF] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Supplier price refresh</div>
          <div className="text-xs text-[#6B6B6E]">
            Refreshes supplier prices in batches of 10 products.
          </div>
        </div>
        <button
          type="button"
          onClick={updateAllPrices}
          disabled={running}
          className="shrink-0 rounded border border-[#123F2B] bg-[#123F2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D3021] disabled:cursor-wait disabled:opacity-50"
        >
          {running ? 'Updating prices…' : finished ? 'Update supplier prices again' : 'Update supplier prices'}
        </button>
      </div>

      {(running || message) && (
        <div className="mt-4 border-t border-[#EDEDE9] pt-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[#6B6B6E]">
            <span className={finished ? 'font-medium text-[#2F6B4F]' : ''}>
              {message}
            </span>
            {total > 0 && <span className="shrink-0 font-semibold tabular-nums">{percent}%</span>}
          </div>

          {total > 0 && (
            <div
              className="relative h-2 w-full overflow-hidden bg-[#E8E8E8]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label={`Supplier price update progress: ${percent}%`}
            >
              <div
                className={`absolute inset-y-0 left-0 transition-[width] duration-500 ease-out ${finished ? 'bg-[#2F6B4F]' : 'bg-[#123F2B]'}`}
                style={{ width: `${percent}%` }}
              />
              {running && !finished && (
                <div className="supplier-progress-shimmer absolute inset-y-0 left-0 w-1/3" />
              )}
            </div>
          )}

          {finished && (
            <div className="mt-2 text-xs font-medium text-[#2F6B4F]">
              Update complete — all eligible products in this run have been checked.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
