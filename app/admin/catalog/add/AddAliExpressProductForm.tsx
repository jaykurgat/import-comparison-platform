'use client'

import { useActionState } from 'react'
import { addAliExpressProduct, type AddImportState } from './actions'

const initialState: AddImportState = { ok: true, message: '' }

export default function AddAliExpressProductForm() {
  const [state, formAction, pending] = useActionState(addAliExpressProduct, initialState)

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div className="rounded-2xl border border-[#E3E3DF] bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold" htmlFor="product">
          AliExpress product URL or product ID
        </label>
        <input
          id="product"
          name="product"
          required
          placeholder="https://www.aliexpress.com/item/1005001234567890.html"
          className="mt-2 w-full rounded-xl border border-[#D8D8D3] px-4 py-3 text-sm outline-none focus:border-[#2F6B4F]"
        />
        <p className="mt-2 text-xs leading-5 text-[#6B6B6E]">
          The importer fetches the real product, keeps its variants as separate supplier SKUs,
          calculates KES pricing, and publishes only variants with current pricing and images.
        </p>
      </div>

      {state.message && (
        <div className={state.ok
          ? 'rounded-2xl border border-[#B9D8C6] bg-[#F2F8F5] p-5 text-sm text-[#24553C]'
          : 'rounded-2xl border border-[#E5B8AE] bg-[#FFF7F5] p-5 text-sm text-[#8B3524]'}>
          <div className="font-semibold">{state.message}</div>
          {state.title && <div className="mt-2">Product: {state.title}</div>}
          {state.variants !== undefined && (
            <div className="mt-1">
              Variants: {state.variants} · Published: {state.published ?? 0} · Not ready: {state.unavailable ?? 0}
            </div>
          )}
          {state.errors && state.errors.length > 0 && (
            <div className="mt-3 space-y-1 text-xs">
              {state.errors.slice(0, 8).map((error) => <div key={error}>{error}</div>)}
              {state.errors.length > 8 && <div>+ {state.errors.length - 8} more errors</div>}
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#123F2B] px-5 py-3 text-sm font-bold text-white hover:bg-[#0D3021] disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? 'Adding product…' : 'Add product to catalog'}
      </button>
    </form>
  )
}
