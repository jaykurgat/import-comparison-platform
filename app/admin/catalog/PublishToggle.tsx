'use client'

import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function toggle() {
    const scrollY = window.scrollY
    startTransition(async () => {
      try {
        await toggleImportPublished(id, !published)
        router.refresh()
        requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'instant' }))
      } catch {
        // Keep the current row state if the server action fails.
      }
    })
  }

  return (
    <button
      type="button"
      disabled={pending || (!published && !canPublish)}
      onClick={toggle}
      title={!published && !canPublish ? 'A supplier SKU must have a current sell price, title, and image before publishing.' : undefined}
      className="border border-[#D8D8D3] bg-white px-2 py-1 text-[10px] font-medium hover:bg-[#F7F7F5] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Saving…' : published ? 'Unpublish' : canPublish ? 'Publish' : 'Not ready'}
    </button>
  )
}
