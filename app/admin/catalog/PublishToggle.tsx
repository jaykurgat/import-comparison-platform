'use client'

import { useTransition } from 'react'
import { toggleImportPublished } from './actions'

export function PublishToggle({
  id,
  published,
  canPublish,
}: {
  id: string
  published: boolean
  canPublish: boolean
}) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending || (!published && !canPublish)}
      onClick={() => startTransition(() => toggleImportPublished(id, !published))}
      title={!published && !canPublish ? 'A supplier SKU must have a current sell price, title, and image before publishing.' : undefined}
      className="rounded border border-[#D8D8D3] px-3 py-1.5 text-xs font-medium hover:bg-[#F7F7F5] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Saving…' : published ? 'Unpublish' : canPublish ? 'Publish' : 'Not ready'}
    </button>
  )
}
