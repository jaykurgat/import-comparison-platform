'use client'

import AddToCartActions from './cart/AddToCartActions'
import { useImportVariantContext, displayOptionName } from './ImportVariantContext'

function getOptionImage(
  variants: ReturnType<typeof useImportVariantContext>['variants'],
  selectedOptions: Record<string, string>,
  group: string,
  value: string,
): string | null {
  // Only use an image from the SKU that represents this option value
  // within the current selection. Do not borrow an image from an
  // unrelated SKU that happens to share the same option value.
  return variants.find((variant) =>
    variant.options[group] === value &&
    Object.entries(selectedOptions).every(([name, selected]) =>
      name === group || !selected || variant.options[name] === selected,
    ) &&
    variant.imageUrl,
  )?.imageUrl ?? null
}

export default function ImportVariantSelector({ productId, title }: { productId: string; title: string }) {
  const {
    variants,
    selectedVariant,
    selectedOptions,
    optionGroups,
    fixedOptions,
    availableVariantCount,
    selectOption,
  } = useImportVariantContext()

  if (!selectedVariant) return null

  return (
    <div className="mt-7 border-t border-slate-100 pt-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-black text-slate-900">
            {optionGroups.length > 0 ? 'Choose options' : 'Product options'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {availableVariantCount > 0
              ? availableVariantCount + ' option' + (availableVariantCount === 1 ? '' : 's') + ' available'
              : 'Currently unavailable'}
          </p>
        </div>
        <div className="text-lg font-black tabular-nums text-slate-950">
          {selectedVariant.currency} {selectedVariant.sellPrice.toLocaleString()}
        </div>
      </div>

      {fixedOptions.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {fixedOptions.map((option) => (
            <span key={option.name} className="shrink-0 bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600">
              {displayOptionName(option.name)}: {option.value}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 border border-slate-200 bg-[#f7f7f3] p-4">
        <div className="flex items-start gap-3">
          {selectedVariant.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedVariant.imageUrl} alt="" className="h-16 w-16 shrink-0 object-contain" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Your selection</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(selectedVariant.options).length > 0 ? (
                Object.entries(selectedVariant.options).map(([name, value]) => (
                  <span key={name} className="bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
                    {displayOptionName(name)}: {value}
                  </span>
                ))
              ) : (
                <span className="text-sm font-bold text-slate-700">Standard option</span>
              )}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {selectedVariant.availableStock} available
            </div>
          </div>
          <div className="text-lg font-black tabular-nums text-slate-950">
            {selectedVariant.currency} {selectedVariant.sellPrice.toLocaleString()}
          </div>
        </div>
      </div>

      {optionGroups.length > 0 && (
        <div className="mt-5 space-y-4">
          {optionGroups.map((group) => (
            <section key={group.name}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900">{displayOptionName(group.name)}</h3>
                <span className="text-xs font-bold text-slate-400">{selectedOptions[group.name] ?? 'Choose'}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {group.values.map((value) => {
                  const active = selectedOptions[group.name] === value
                  const imageUrl = getOptionImage(variants, selectedOptions, group.name, value)
                  const available = variants.some((variant) =>
                    variant.availableStock > 0 &&
                    variant.options[group.name] === value &&
                    Object.entries(selectedOptions).every(([name, selected]) =>
                      name === group.name || !selected || variant.options[name] === selected,
                    ),
                  )

                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!available}
                      onClick={() => selectOption(group.name, value)}
                      aria-label={`${displayOptionName(group.name)}: ${value}${available ? '' : ' (unavailable)'}`}
                      className={[
                        imageUrl
                          ? 'h-16 w-16 shrink-0 overflow-hidden border bg-white p-0.5 transition'
                          : 'border p-0 text-left text-xs leading-5 transition',
                        active ? 'border-[#123f2b] ring-1 ring-[#123f2b]' : 'border-slate-200 hover:border-slate-300',
                        !available ? 'cursor-not-allowed opacity-40' : '',
                      ].join(' ')}
                    >
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt=""
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="block font-black text-slate-800">{value}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}



      {selectedVariant.availableStock > 0 ? (
        <AddToCartActions
          key={selectedVariant.skuId}
          item={{
            key: 'supplier:' + productId + ':' + selectedVariant.skuId,
            kind: 'supplier',
            title,
            imageUrl: selectedVariant.imageUrl,
            price: selectedVariant.sellPrice,
            currency: selectedVariant.currency,
            quantity: 1,
            availableStock: selectedVariant.availableStock,
            sku: selectedVariant.skuId,
            productId,
            skuId: selectedVariant.skuId,
            options: selectedVariant.options,
          }}
        />
      ) : (
        <div className="mt-5 border border-amber-100 bg-amber-50 p-4">
          <div className="text-sm font-black text-amber-900">This selection is currently unavailable</div>
          <p className="mt-1 text-xs text-amber-800">Choose another available option above, or check back after stock is refreshed.</p>
        </div>
      )}
    </div>
  )
}
