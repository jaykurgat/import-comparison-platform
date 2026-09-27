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
}: {
  action: (beforeIso: string) => Promise<unknown>
}) {
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function updateAllPrices() {
    setRunning(true)
    setMessage(null)

    const beforeIso = new Date().toISOString()
    let products = 0
    let repriced = 0
    let changed = 0
    let unavailable = 0
    const errors: string[] = []

    try {
      while (true) {
        const result = (await action(beforeIso)) as BatchResult
        products += result.selectedProducts
        repriced += result.repricedSkus
        changed += result.changedSkus
        unavailable += result.unavailableSkus
        errors.push(...result.errors)

        if (result.selectedProducts === 0 || result.syncedProducts === 0) break

        setMessage(
          `Updating… ${products} product(s) checked, ${changed} price change(s) found.`,
        )
      }

      setMessage(
        errors.length
          ? `Finished: ${products} product(s) checked, ${repriced} SKU(s) repriced, ${changed} price change(s), ${unavailable} unavailable, ${errors.length} error(s).`
          : `Finished: ${products} product(s) checked, ${repriced} SKU(s) repriced, ${changed} price change(s).`,
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Price update failed.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={updateAllPrices}
        disabled={running}
        className="rounded border border-[#123F2B] bg-[#123F2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D3021] disabled:cursor-wait disabled:opacity-50"
      >
        {running ? 'Updating prices…' : 'Update supplier prices'}
      </button>
      {message && <span className="ml-3 max-w-md text-xs text-[#6B6B6E]">{message}</span>}
    </div>
  )
}
