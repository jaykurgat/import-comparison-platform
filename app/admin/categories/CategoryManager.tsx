'use client'

import { useActionState, useState, useTransition } from 'react'
import { createCategory, updateCategory, setCategoryActive, moveCategoryOrder, type CategoryActionState } from './actions'

type Category = { id: string; name: string; parentId: string | null; isActive: boolean; sortOrder: number }
const initialState: CategoryActionState = { ok: false, message: '' }

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(createCategory, initialState)
  const [selectedId, setSelectedId] = useState<string | null>(categories[0]?.id ?? null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editParent, setEditParent] = useState('')
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, startTransition] = useTransition()

  const byId = new Map(categories.map((category) => [category.id, category]))
  const children = new Map<string | null, Category[]>()
  for (const category of categories) children.set(category.parentId, [...(children.get(category.parentId) ?? []), category])
  for (const list of children.values()) list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))

  function path(id: string) {
    const parts: string[] = []
    const seen = new Set<string>()
    let current = byId.get(id)
    while (current && !seen.has(current.id)) {
      seen.add(current.id)
      parts.unshift(current.name)
      current = current.parentId ? byId.get(current.parentId) : undefined
    }
    return parts.join(' / ')
  }

  const selected = selectedId ? byId.get(selectedId) : undefined
  const query = search.trim().toLocaleLowerCase()
  const visible = (category: Category) => !query || path(category.id).toLocaleLowerCase().includes(query)

  function beginEdit(category: Category) {
    setSelectedId(category.id)
    setEditingId(category.id)
    setEditName(category.name)
    setEditParent(category.parentId ?? '')
    setNotice('')
  }

  function runAction(action: () => Promise<unknown>, success: string) {
    startTransition(async () => {
      try {
        await action()
        setNotice(success)
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Action failed. Please try again.')
      }
    })
  }

  function saveEdit() {
    if (!editingId) return
    runAction(async () => {
      await updateCategory(editingId, editName, editParent || null)
      setEditingId(null)
    }, 'Category changes saved.')
  }

  function renderTree(parentId: string | null, depth = 0): React.ReactNode {
    return (children.get(parentId) ?? []).filter(visible).map((category) => (
      <div key={category.id}>
        <div className={'flex items-center gap-1 rounded-lg px-1 py-1 transition ' + (selectedId === category.id ? 'bg-[#EAF2EC]' : 'hover:bg-[#F5F7F3]')}>
          <button type="button" onClick={() => { setSelectedId(category.id); setEditingId(null); setNotice('') }} className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 text-left" style={{ paddingLeft: depth * 14 + 4 }}>
            <span className={'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[10px] ' + ((children.get(category.id)?.length ?? 0) ? 'border-[#D8E4D9] bg-white text-[#41664A]' : 'border-transparent text-[#A3AAA2]')}>{(children.get(category.id)?.length ?? 0) ? '⌄' : '·'}</span>
            <span className="min-w-0 flex-1">
              <span className={'block truncate text-[12px] font-semibold ' + (selectedId === category.id ? 'text-[#123F2B]' : 'text-[#303A31]')}>{category.name}</span>
              <span className="block text-[10px] text-[#858C84]">{children.get(category.id)?.length ?? 0} children</span>
            </span>
          </button>
          {!category.isActive && <span className="rounded-full bg-[#F8E9E5] px-1.5 py-0.5 text-[9px] font-bold text-[#96513F]">Hidden</span>}
          <button type="button" onClick={() => beginEdit(category)} className="rounded-md px-2 py-1.5 text-[10px] font-semibold text-[#667166] hover:bg-white hover:text-[#123F2B]" aria-label={'Edit ' + category.name}>Edit</button>
        </div>
        {renderTree(category.id, depth + 1)}
      </div>
    ))
  }

  const maxDepth = Math.max(0, ...categories.map((category) => path(category.id).split(' / ').length))
  const stats = [
    { label: 'Categories', value: categories.length },
    { label: 'Primary', value: (children.get(null) ?? []).length },
    { label: 'Levels', value: maxDepth },
    { label: 'Active', value: categories.filter((category) => category.isActive).length },
  ]

  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map((item) => <div key={item.label} className="rounded-xl border border-[#E3E7E0] bg-white px-3.5 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7B847A]">{item.label}</p><p className="mt-1 text-xl font-semibold tracking-tight text-[#173D29]">{item.value.toLocaleString()}</p></div>)}
    </div>

    <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.35fr)]">
      <section className="overflow-hidden rounded-xl border border-[#E1E5DE] bg-white">
        <header className="border-b border-[#E8EBE5] px-4 py-3.5">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-[#203B29]">Category tree</h2><p className="mt-0.5 text-[10px] text-[#7D857D]">Select any level to edit</p></div><span className="rounded-md bg-[#F0F4EF] px-2 py-1 text-[10px] font-bold text-[#426449]">{categories.length} total</span></div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search names or full paths…" aria-label="Search categories" className="mt-3 w-full rounded-lg border border-[#E0E5DE] bg-[#FBFCFA] px-3 py-2 text-xs outline-none placeholder:text-[#9AA19A] focus:border-[#829A84] focus:ring-2 focus:ring-[#EAF2EC]" />
        </header>
        <div className="max-h-[560px] overflow-auto p-2">{renderTree(null)}</div>
        <footer className="border-t border-[#E8EBE5] bg-[#FAFBF9] px-4 py-3 text-[10px] leading-4 text-[#727B72]">Primary categories have no parent. Every nested level adds precision for search, filters and recommendations.</footer>
      </section>

      <div className="space-y-4">
        <section className="rounded-xl border border-[#E1E5DE] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#748A73]">Selected category</p><h2 className="mt-1 text-lg font-semibold tracking-tight text-[#203B29]">{selected?.name ?? 'Choose a category'}</h2><p className="mt-1 break-words text-[11px] text-[#7B847B]">{selected ? path(selected.id) : 'Select an item in the tree to see its location.'}</p></div>
            {selected && <span className={'rounded-full px-2.5 py-1 text-[10px] font-bold ' + (selected.isActive ? 'bg-[#EAF2EC] text-[#28603B]' : 'bg-[#F8E9E5] text-[#96513F]')}>{selected.isActive ? 'Active' : 'Hidden'}</span>}
          </div>
          {selected && <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[#F7F8F5] p-3"><p className="text-[10px] text-[#7B847B]">Parent</p><p className="mt-1 truncate text-xs font-semibold text-[#344438]">{selected.parentId ? byId.get(selected.parentId)?.name : 'Primary category'}</p></div>
            <div className="rounded-lg bg-[#F7F8F5] p-3"><p className="text-[10px] text-[#7B847B]">Subcategories</p><p className="mt-1 text-xs font-semibold text-[#344438]">{children.get(selected.id)?.length ?? 0}</p></div>
          </div>}
          {selected && editingId === selected.id ? <div className="mt-4 space-y-3 border-t border-[#E8EBE5] pt-4">
            <label className="block text-xs font-semibold text-[#48564A]">Category name<input value={editName} onChange={(event) => setEditName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#DCE2DA] px-3 py-2 text-sm font-normal outline-none focus:border-[#829A84]" /></label>
            <label className="block text-xs font-semibold text-[#48564A]">Parent category<select value={editParent} onChange={(event) => setEditParent(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#DCE2DA] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[#829A84]"><option value="">No parent — primary category</option>{categories.filter((item) => item.id !== selected.id && !path(item.id).startsWith(path(selected.id) + ' / ')).map((item) => <option key={item.id} value={item.id}>{path(item.id)}</option>)}</select></label>
            <div className="flex gap-2"><button type="button" disabled={busy} onClick={saveEdit} className="rounded-lg bg-[#123F2B] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save changes'}</button><button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-[#DCE2DA] px-4 py-2 text-xs font-semibold text-[#48564A]">Cancel</button></div>
          </div> : selected && <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E8EBE5] pt-4">
            <button type="button" onClick={() => beginEdit(selected)} className="rounded-lg bg-[#123F2B] px-3 py-2 text-xs font-bold text-white">Edit details</button>
            <button type="button" onClick={() => { setEditingId(null); document.getElementById('new-category-name')?.focus() }} className="rounded-lg border border-[#DCE2DA] bg-white px-3 py-2 text-xs font-semibold text-[#304936]">Add child</button>
            <button type="button" disabled={busy} onClick={() => runAction(() => setCategoryActive(selected.id, !selected.isActive), selected.isActive ? 'Category hidden from storefront.' : 'Category activated.')} className="rounded-lg border border-[#DCE2DA] bg-white px-3 py-2 text-xs font-semibold text-[#59665B]">{selected.isActive ? 'Hide from storefront' : 'Activate category'}</button>
            <div className="flex gap-1"><button type="button" title="Move up among siblings" onClick={() => runAction(() => moveCategoryOrder(selected.id, 'up'), 'Display order updated.')} className="rounded-lg border border-[#DCE2DA] px-3 py-2 text-xs text-[#304936]">↑</button><button type="button" title="Move down among siblings" onClick={() => runAction(() => moveCategoryOrder(selected.id, 'down'), 'Display order updated.')} className="rounded-lg border border-[#DCE2DA] px-3 py-2 text-xs text-[#304936]">↓</button></div>
          </div>}
        </section>

        <section className="rounded-xl border border-[#E1E5DE] bg-white p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#748A73]">Add to catalogue</p><h2 className="mt-1 text-sm font-bold text-[#203B29]">Create a primary category or subcategory</h2><p className="mt-1 text-[11px] leading-4 text-[#7B847B]">Leave the parent empty for a primary category. Choose any existing category for a nested level.</p>
          <form action={formAction} className="mt-4 space-y-3">
            <label className="block text-xs font-semibold text-[#48564A]">Category name<input id="new-category-name" name="name" required placeholder="e.g. Maxi Dresses" className="mt-1.5 w-full rounded-lg border border-[#DCE2DA] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#829A84]" /></label>
            <label className="block text-xs font-semibold text-[#48564A]">Parent category<select name="parentId" defaultValue="" className="mt-1.5 w-full rounded-lg border border-[#DCE2DA] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#829A84]"><option value="">No parent — primary category</option>{categories.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{path(item.id)}</option>)}</select></label>
            <button disabled={pending} className="w-full rounded-lg bg-[#123F2B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0D3021] disabled:opacity-50">{pending ? 'Creating…' : 'Create category'}</button>
            {state.message && <p role="status" className={'rounded-lg px-3 py-2 text-xs ' + (state.ok ? 'bg-[#EAF2EC] text-[#28603B]' : 'bg-[#FBEDEA] text-[#914C3C]')}>{state.message}</p>}
          </form>
        </section>
        {notice && <div role="status" className="rounded-lg border border-[#D9E3D7] bg-[#F0F6EE] px-4 py-3 text-xs font-medium text-[#315B3A]">{notice}</div>}
      </div>
    </div>
  </div>
}
