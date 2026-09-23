'use client'

import { useState } from 'react'
import { ImportCheckoutForm } from '@/app/import/[productId]/[skuId]/ImportCheckoutForm'

type Variant = {
  skuId: string
  color: string | null
  size: string | null
  availableStock: number
  sellPrice: number
  currency: string
  priceDataAsOf: Date
  isStale: boolean
}

function variantLabel(variant: Variant): string {
  const parts = [variant.color, variant.size].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'Variant ' + variant.skuId
}

export default function ImportVariantSelector({
  productId,
  title,
  variants,
}: {
  productId: string
  title: string
  variants: Variant[]
}) {
  const [selectedSkuId, setSelectedSkuId] = useState(
    variants.find((variant) => variant.availableStock > 0)?.skuId ?? variants[0]?.skuId ?? '',
  )

  const selected = variants.find((variant) => variant.skuId === selectedSkuId) ?? variants[0]
  const availableVariants = variants.filter((variant) => variant.availableStock > 0)
  const currency = selected?.currency ?? 'KES'

  if (!selected) return null

  return (
    <div className="mt-7 border-t border-slate-100 pt-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-black text-slate-900">Choose a variant</h2>
          <p className="mt-1 text-xs text-slate-500">
            {availableVariants.length > 0
              ? availableVariants.length + ' of ' + variants.length + ' variants currently available'
              : 'All supplier variants are currently unavailable'}
          </p>
        </div>
        <div className="text-lg font-black tabular-nums text-slate-950">
          {currency} {selected.sellPrice.toLocaleString()}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {variants.map((variant) => {
          const isSelected = variant.skuId === selected.skuId
          const available = variant.availableStock > 0
          return (
            <button
              key={variant.skuId}
              type="button"
              onClick={() => setSelectedSkuId(variant.skuId)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${isSelected ? 'border-[#123f2b] bg-[#f2f8f5]' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <span>
                <span className="block text-sm font-bold text-slate-800">{variantLabel(variant)}</span>
                <span className="mt-1 block text-xs text-slate-400">
                  {available ? variant.availableStock + ' available' : 'Currently unavailable'}
                </span>
              </span>
              <span className="ml-4 text-sm font-black tabular-nums text-slate-900">
                {variant.currency} {variant.sellPrice.toLocaleString()}
              </span>
            </button>
          )
        })}
      </div>

      {selected.availableStock > 0 ? (
        <ImportCheckoutForm
          key={selected.skuId}
          productId={productId}
          skuId={selected.skuId}
          sellPrice={selected.sellPrice}
          title={title}
        />
      ) : (
        <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <div className="text-sm font-black text-amber-900">This variant is currently unavailable</div>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Choose another variant above, or check back after the supplier stock is refreshed.
          </p>
        </div>
      )}
    </div>
  )
}