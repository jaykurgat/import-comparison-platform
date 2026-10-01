'use client'

import { useActionState, useState, useTransition } from 'react'
import Link from 'next/link'
import { createCategory, updateCategory, type CategoryActionState } from './actions'

type Category = { id: string; name: string; parentId: string | null }
const initialState: CategoryActionState = { ok: false, message: '' }

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(createCategory, initialState)
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editParent, setEditParent] = useState('')
  const [editMessage, setEditMessage] = useState('')
  const [isSaving, startSaving] = useTransition()

  const children = new Map<string | null, Category[]>()
  for (const category of categories) children.set(category.parentId, [...(children.get(category.parentId) ?? []), category])
  for (const list of children.values()) list.sort((a, b) => a.name.localeCompare(b.name))

  function path(id: string) {
    const byId = new Map(categories.map((category) => [category.id, category]))
    const parts: string[] = []
    const seen = new Set<string>()
    let current = byId.get(id)
    while (current && !seen.has(current.id)) {
      seen.add(current.id); parts.unshift(current.name)
      current = current.parentId ? byId.get(current.parentId) : undefined
    }
    return parts.join(' / ')
  }

  function beginEdit(category: Category) {
    setEditing(category.id); setEditName(category.name); setEditParent(category.parentId ?? ''); setEditMessage('')
  }

  function saveEdit() {
    if (!editing) return
    startSaving(async () => {
      try { await updateCategory(editing, editName, editParent || null); setEditing(null) }
      catch (error) { setEditMessage(error instanceof Error ? error.message : 'Could not save category.') }
    })
  }

  function render(parentId: string | null, depth = 0): React.ReactNode {
    return (children.get(parentId) ?? []).map((category) => (
      <div key={category.id} className="border-b border-[#EAEAE5]">
        {editing === category.id ? (
          <div className="grid gap-3 bg-[#fbfbf8] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="text-xs font-bold text-slate-600">Category name<input value={editName} onChange={(e)=>setEditName(e.target.value)} className="mt-1 block w-full border border-[#D8D8D3] bg-white px-3 py-2 text-sm outline-none focus:border-[#123F2B]" /></label>
            <label className="text-xs font-bold text-slate-600">Parent<select value={editParent} onChange={(e)=>setEditParent(e.target.value)} className="mt-1 block w-full border border-[#D8D8D3] bg-white px-3 py-2 text-sm outline-none focus:border-[#123F2B]"><option value="">Top level</option>{categories.filter((option)=>option.id!==category.id).map((option)=><option key={option.id} value={option.id}>{path(option.id)}</option>)}</select></label>
            <div className="flex gap-2"><button type="button" onClick={saveEdit} disabled={isSaving} className="bg-[#123F2B] px-4 py-2 text-xs font-black text-white">{isSaving?'Saving…':'Save'}</button><button type="button" onClick={()=>setEditing(null)} className="border border-[#D8D8D3] bg-white px-4 py-2 text-xs font-bold">Cancel</button></div>
            {editMessage && <p className="text-xs font-bold text-red-700 sm:col-span-3">{editMessage}</p>}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 py-3" style={{ paddingLeft: depth * 22 }}>
            <div className="min-w-0"><div className="font-semibold">{category.name}</div><div className="mt-0.5 text-xs text-[#8A8A8E]">{path(category.id)} · Level {depth + 1}</div></div>
            <div className="flex shrink-0 items-center gap-3"><span className="hidden text-xs text-[#8A8A8E] sm:inline">{children.get(category.id)?.length ?? 0} direct child{(children.get(category.id)?.length ?? 0) === 1 ? '' : 'ren'}</span><button type="button" onClick={()=>beginEdit(category)} className="border border-[#D8D8D3] bg-white px-3 py-1.5 text-xs font-bold hover:border-[#F5A400]">Edit</button></div>
          </div>
        )}
        {render(category.id, depth + 1)}
      </div>
    ))
  }

  return <div className="space-y-8">
    <section className="border border-[#E3E3DF] bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold">Build the hierarchy</h2>
      <p className="mt-1 text-sm text-[#6B6B6E]">Create any depth you need. Rename or move categories without changing product assignments.</p>
      <form action={formAction} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-sm font-semibold">Category name<input name="name" required placeholder="e.g. Men" className="mt-2 block w-full border border-[#D8D8D3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2F6B4F]" /></label>
        <label className="text-sm font-semibold">Parent category<select name="parentId" className="mt-2 block w-full border border-[#D8D8D3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2F6B4F]"><option value="">Top level</option>{categories.map((category)=><option key={category.id} value={category.id}>{path(category.id)}</option>)}</select></label>
        <button disabled={pending} className="border bg-[#123F2B] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{pending ? 'Adding…' : 'Add category'}</button>
      </form>
      {state.message && <p className={'mt-4 text-sm font-semibold ' + (state.ok ? 'text-[#2F6B4F]' : 'text-[#A6432D]')}>{state.message}</p>}
    </section>
    <section className="border border-[#E3E3DF] bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold">Category structure</h2><p className="mt-1 text-sm text-[#6B6B6E]">This hierarchy powers storefront filters, product categorization and coupon targeting.</p></div><Link href="/products" className="text-sm font-bold text-[#2F6B4F]">View storefront →</Link></div>
      <div className="mt-5">{render(null)}</div>
    </section>
  </div>
}
