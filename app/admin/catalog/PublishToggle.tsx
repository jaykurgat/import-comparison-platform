'use client'

import { useTransition } from 'react'
import { toggleImportPublished } from './actions'

export function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleImportPublished(id, !published))}
      className="rounded border border-[#D8D8D3] px-3 py-1.5 text-xs font-medium hover:bg-[#F7F7F5] disabled:opacity-50"
    >
      {pending ? 'Saving…' : published ? 'Unpublish' : 'Publish'}
    </button>
  )
}
