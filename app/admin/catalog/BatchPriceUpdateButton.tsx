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

  async function updateAllPrices() {
    setRunning(true)
    setMessage(null)
    setCompleted(0)

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
    <div className="flex min-w-[420px] items-center gap-3">
      <button
        type="button"
        onClick={updateAllPrices}
        disabled={running}
        className="shrink-0 rounded border border-[#123F2B] bg-[#123F2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D3021] disabled:cursor-wait disabled:opacity-50"
      >
        {running ? 'Updating prices…' : 'Update supplier prices'}
      </button>

      {(running || message) && (
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between text-xs text-[#6B6B6E]">
            <span>{message}</span>
            {total > 0 && <span className="ml-2 shrink-0 font-medium">{percent}%</span>}
          </div>

          {total > 0 && (
            <div className="h-1.5 w-full overflow-hidden bg-[#E8E8E8]" aria-label={`Price update progress: ${percent}%`}>
              <div
                className={`h-full transition-[width] duration-300 ${batchRunning ? 'animate-pulse' : ''}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
