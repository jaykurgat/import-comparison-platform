'use client'

import { useState } from 'react'

export function SyncButton({
  action,
  label,
}: {
  action: () => Promise<unknown>
  label: string
}) {
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  return (
    <form
      action={async () => {
        setRunning(true)
        setMessage(null)
        try {
          const result = await action()
          const value = result as { errors?: unknown[]; pricesComputed?: number; skusPersisted?: number }
          setMessage(
            value.pricesComputed !== undefined
              ? `Repriced ${value.pricesComputed} SKU(s).`
              : `Sync complete — ${value.skusPersisted ?? 0} SKU(s) persisted.${value.errors?.length ? ` ${value.errors.length} error(s).` : ''}`,
          )
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Operation failed.')
        } finally {
          setRunning(false)
        }
      }}
    >
      <button
        type="submit"
        disabled={running}
        className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F7F5] disabled:cursor-wait disabled:opacity-50"
      >
        {running ? 'Working…' : label}
      </button>
      {message && <span className="ml-3 text-xs text-[#6B6B6E]">{message}</span>}
    </form>
  )
}
