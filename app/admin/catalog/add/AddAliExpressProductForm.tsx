'use client'

import { useActionState } from 'react'
import { addAliExpressProduct, type AddImportState } from './actions'

const initialState: AddImportState = { ok: true, message: '' }

export default function AddAliExpressProductForm() {
  const [state, formAction, pending] = useActionState(addAliExpressProduct, initialState)
  const review = state.categoryReview
  const roots = review?.categories.filter((category) => category.isRoot) ?? []
  const leaves = review?.categories.filter((category) => !category.isRoot) ?? []

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div className="rounded-2xl border border-[#E3E3DF] bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold" htmlFor="product">
          AliExpress product URL or product ID
        </label>
        <input
          id="product"
          name="product"
          required={!review}
          defaultValue={state.productId ?? ''}
          placeholder="https://www.aliexpress.com/item/1005001234567890.html"
          className="mt-2 w-full rounded-xl border border-[#D8D8D3] px-4 py-3 text-sm outline-none focus:border-[#2F6B4F]"
        />
        <p className="mt-2 text-xs leading-5 text-[#6B6B6E]">
          The importer fetches the real product, keeps its options as separate supplier SKUs,
          calculates KES pricing, and publishes only variants with current pricing, images, and a
          confirmed KijijiCart category.
        </p>
      </div>

      {state.message && (
        <div
          className={
            state.ok
              ? 'rounded-2xl border border-[#B9D8C6] bg-[#F2F8F5] p-5 text-sm text-[#24553C]'
              : 'rounded-2xl border border-[#E5B8AE] bg-[#FFF7F5] p-5 text-sm text-[#8B3524]'
          }
        >
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

      {review && (
        <section className="overflow-hidden rounded-2xl border border-[#E5C98D] bg-[#FFFBF2] shadow-sm">
          <div className="border-b border-[#E9D9B5] px-6 py-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9A6700]">
              Category review required
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-[#2A2418]">
              Give this product a KijijiCart category before importing it
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#625A49]">{review.reason}</p>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#E9D9B5] bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A806E]">
                  Product
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2A2418]">{review.title}</p>
              </div>
              <div className="rounded-xl border border-[#E9D9B5] bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A806E]">
                  Supplier category
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2A2418]">
                  {review.sourceCategoryName ?? 'Not available'}
                </p>
                {review.sourceCategoryId && (
                  <p className="mt-1 text-xs text-[#8A806E]">Source ID: {review.sourceCategoryId}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#D8D8D3] bg-white p-4">
              <h3 className="text-sm font-bold text-[#1C1C1E]">First, check the existing categories</h3>
              <p className="mt-1 text-xs leading-5 text-[#6B6B6E]">
                Use an existing subcategory when the product fits it. This keeps the catalogue
                consistent and avoids creating near-duplicate categories.
              </p>

              <label className="mt-4 block text-sm font-semibold text-[#1C1C1E]" htmlFor="categoryId">
                KijijiCart category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue=""
                className="mt-2 w-full rounded-xl border border-[#D8D8D3] bg-white px-4 py-3 text-sm outline-none focus:border-[#2F6B4F]"
              >
                <option value="">Select an existing subcategory…</option>
                {leaves.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.parentName} → {category.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                name="decision"
                value="use-existing"
                disabled={pending}
                className="mt-3 rounded-xl bg-[#123F2B] px-5 py-3 text-sm font-bold text-white hover:bg-[#0D3021] disabled:cursor-wait disabled:opacity-50"
              >
                {pending ? 'Saving…' : 'Use selected category and continue'}
              </button>
            </div>

            <div className="rounded-xl border border-[#D8D8D3] bg-white p-4">
              <h3 className="text-sm font-bold text-[#1C1C1E]">No existing category fits?</h3>
              <p className="mt-1 text-xs leading-5 text-[#6B6B6E]">
                Create a new, specific subcategory when this represents a distinct shopping intent
                and the existing categories would make the product hard to find. Do not create one
                just for a color, size, material, brand, model, or other product option.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  New category name
                  <input
                    name="newCategoryName"
                    placeholder="e.g. Blenders"
                    className="mt-2 w-full rounded-xl border border-[#D8D8D3] px-4 py-3 text-sm font-normal outline-none focus:border-[#2F6B4F]"
                  />
                </label>

                <label className="block text-sm font-semibold">
                  Parent department
                  <select
                    name="parentCategoryId"
                    defaultValue=""
                    className="mt-2 w-full rounded-xl border border-[#D8D8D3] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[#2F6B4F]"
                  >
                    <option value="">Select a department…</option>
                    {roots.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="submit"
                name="decision"
                value="create-new"
                disabled={pending}
                className="mt-3 rounded-xl border border-[#123F2B] px-5 py-3 text-sm font-bold text-[#123F2B] hover:bg-[#F2F8F5] disabled:cursor-wait disabled:opacity-50"
              >
                {pending ? 'Creating…' : 'Create category and continue'}
              </button>
            </div>

            <div className="rounded-xl bg-[#F7F7F5] p-4 text-xs leading-5 text-[#5F5F62]">
              <p className="font-bold text-[#1C1C1E]">Category creation guide</p>
              <ul className="mt-2 space-y-1.5">
                <li>• Create a category when products represent a distinct product type or shopping intent.</li>
                <li>• Prefer one useful category over several categories that differ only by product options.</li>
                <li>• The new category is saved as the canonical KijijiCart category.</li>
                <li>• The supplier category mapping is also saved, so future products from the same supplier category can use this decision automatically.</li>
              </ul>
            </div>
          </div>

          <input type="hidden" name="reviewProductId" value={state.productId ?? ''} />
        </section>
      )}

      {!review && (
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#123F2B] px-5 py-3 text-sm font-bold text-white hover:bg-[#0D3021] disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? 'Adding product…' : 'Add product to catalog'}
        </button>
      )}
    </form>
  )
}
