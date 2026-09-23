'use client'

import { ImportCheckoutForm } from '@/app/import/[productId]/[skuId]/ImportCheckoutForm'
import { useMemo, useState } from 'react'

type Variant = {
  skuId: string
  options: Record<string, string>
  imageUrl: string | null
  availableStock: number
  sellPrice: number
  currency: string
}

type OptionGroup = {
  name: string
  values: string[]
}

function getOptionGroups(variants: Variant[]): { selectable: OptionGroup[]; fixed: Array<{ name: string; value: string }> } {
  const names: string[] = []
  const seen = new Set<string>()

  for (const variant of variants) {
    for (const name of Object.keys(variant.options)) {
      const cleanName = name.trim()
      if (cleanName && !seen.has(cleanName)) {
        seen.add(cleanName)
        names.push(cleanName)
      }
    }
  }

  const groups = names.map((name) => {
    const values = new Set<string>()
    for (const variant of variants) {
      const value = variant.options[name]
      if (value) values.add(value)
    }
    return { name, values: [...values] }
  })

  return {
    selectable: groups.filter((group) => group.values.length > 1),
    fixed: groups
      .filter((group) => group.values.length === 1)
      .map((group) => ({ name: group.name, value: group.values[0] })),
  }
}

function matchesOptions(variant: Variant, options: Record<string, string>, ignoredGroup?: string): boolean {
  return Object.entries(options).every(([name, value]) => name === ignoredGroup || !value || variant.options[name] === value)
}

function formatSelectedVariant(variant: Variant): string {
  const values = Object.entries(variant.options)
  if (values.length === 0) return 'Supplier SKU ' + variant.skuId
  return values.map(([name, value]) => name + ': ' + value).join(' · ')
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
  const firstAvailable = variants.find((variant) => variant.availableStock > 0) ?? variants[0]
  const [selectedSkuId, setSelectedSkuId] = useState(firstAvailable?.skuId ?? '')

  const selected = variants.find((variant) => variant.skuId === selectedSkuId) ?? firstAvailable
  const availableVariants = variants.filter((variant) => variant.availableStock > 0)
  const { selectable: optionGroups, fixed: fixedOptions } = useMemo(() => getOptionGroups(variants), [variants])

  if (!selected) return null

  function chooseOption(name: string, value: string) {
    const candidateOptions = { ...selected.options, [name]: value }

    const exactAvailable = variants.find(
      (variant) => variant.availableStock > 0 && matchesOptions(variant, candidateOptions),
    )
    const exactAny = variants.find((variant) => matchesOptions(variant, candidateOptions))

    setSelectedSkuId(exactAvailable?.skuId ?? exactAny?.skuId ?? selected.skuId)
  }

  const currency = selected.currency

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

      {fixedOptions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {fixedOptions.map((option) => (
            <span key={option.name} className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600">
              {option.name}: {option.value}
            </span>
          ))}
        </div>
      )}

      {optionGroups.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          This product has one customer-facing supplier configuration. The exact supplier SKU is retained for checkout.
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {optionGroups.map((group) => (
            <section key={group.name}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900">{group.name}</h3>
                <span className="text-xs font-bold text-slate-400">{selected.options[group.name] ?? 'Choose'}</span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {group.values.map((value) => {
                  const active = selected.options[group.name] === value
                  const imageUrl = variants.find((variant) => variant.options[group.name] === value && variant.imageUrl)?.imageUrl ?? null
                  const isAvailable = variants.some((variant) => (
                    variant.availableStock > 0 &&
                    variant.options[group.name] === value &&
                    matchesOptions(variant, selected.options, group.name)
                  ))

                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => chooseOption(group.name, value)}
                      className={[
                        'flex min-h-20 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                        active ? 'border-[#123f2b] bg-[#f2f8f5]' : 'border-slate-200 bg-white hover:border-slate-300',
                        !isAvailable ? 'cursor-not-allowed opacity-45' : '',
                      ].join(' ')}
                    >
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />
                      ) : (
                        <span className="h-14 w-14 shrink-0 rounded-lg bg-slate-100" aria-hidden="true" />
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm font-black text-slate-800">{value}</span>
                        <span className="mt-1 block text-[10px] font-bold text-slate-400">
                          {isAvailable ? (active ? 'Selected' : 'Available') : 'Unavailable'}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-[#f7f7f3] p-4">
        <div className="flex items-start gap-3">
          {selected.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Selected supplier variant</div>
            <div className="mt-1 text-sm font-black text-slate-900">{formatSelectedVariant(selected)}</div>
            <div className="mt-1 text-xs text-slate-500">Stock: {selected.availableStock} · SKU {selected.skuId}</div>
          </div>
          <div className="text-lg font-black tabular-nums text-slate-950">
            {currency} {selected.sellPrice.toLocaleString()}
          </div>
        </div>
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
          <p className="mt-1 text-xs leading-5 text-amber-800">Choose another available option above, or check back after supplier stock is refreshed.</p>
        </div>
      )}
    </div>
  )
}
