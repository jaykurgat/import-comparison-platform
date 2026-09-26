'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createCategory, type CategoryActionState } from './actions'

type Category = {
  id: string
  name: string
  parentId: string | null
}

const initialState: CategoryActionState = { ok: false, message: '' }

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(createCategory, initialState)

  const children = new Map<string | null, Category[]>()
  for (const category of categories) {
    const list = children.get(category.parentId) ?? []
    list.push(category)
    children.set(category.parentId, list)
  }

  function render(parentId: string | null, depth = 0): React.ReactNode {
    return (children.get(parentId) ?? []).map((category) => (
      <div key={category.id}>
        <div className="flex items-center justify-between gap-3 border-b border-[#EAEAE5] py-3" style={{ paddingLeft: depth * 22 }}>
          <div>
            <div className="font-semibold">{category.name}</div>
            <div className="text-xs text-[#8A8A8E]">{depth === 0 ? 'Primary category' : 'Subcategory'}</div>
          </div>
          <span className="text-xs text-[#8A8A8E]">{children.get(category.id)?.length ?? 0} subcategor{(children.get(category.id)?.length ?? 0) === 1 ? 'y' : 'ies'}</span>
        </div>
        {render(category.id, depth + 1)}
      </div>
    ))
  }

  return (
    <div className="space-y-8">
      <section className="border border-[#E3E3DF] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">Add a category</h2>
        <p className="mt-1 text-sm text-[#6B6B6E]">Create a primary category or place it under any existing category. Subcategories can have their own subcategories.</p>

        <form action={formAction} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-sm font-semibold">
            Category name
            <input name="name" required placeholder="e.g. Men" className="mt-2 block w-full border border-[#D8D8D3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2F6B4F]" />
          </label>

          <label className="text-sm font-semibold">
            Parent category
            <select name="parentId" className="mt-2 block w-full border border-[#D8D8D3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2F6B4F]">
              <option value="">Primary category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {'— '.repeat(getDepth(category.id, categories))}{category.name}
                </option>
              ))}
            </select>
          </label>

          <button disabled={pending} className="border bg-[#123F2B] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {pending ? 'Adding…' : 'Add category'}
          </button>
        </form>

        {state.message && (
          <p className={'mt-4 text-sm font-semibold ' + (state.ok ? 'text-[#2F6B4F]' : 'text-[#A6432D]')}>{state.message}</p>
        )}
      </section>

      <section className="border border-[#E3E3DF] bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Category structure</h2>
            <p className="mt-1 text-sm text-[#6B6B6E]">This is the customer-facing hierarchy. It can grow beyond the current built-in taxonomy.</p>
          </div>
          <Link href="/products" className="text-sm font-bold text-[#2F6B4F]">View storefront →</Link>
        </div>
        <div className="mt-5">{render(null)}</div>
      </section>
    </div>
  )
}

function getDepth(id: string, categories: Category[]) {
  const byId = new Map(categories.map((category) => [category.id, category]))
  let depth = 0
  let current = byId.get(id)
  const seen = new Set<string>()

  while (current?.parentId && !seen.has(current.id)) {
    seen.add(current.id)
    depth += 1
    current = byId.get(current.parentId)
  }

  return depth
}
