'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const SHOW_DELAY_MS = 120
const MAX_VISIBLE_MS = 10000

function isInternalNavigation(event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false

  const target = event.target
  if (!(target instanceof Element)) return false

  const anchor = target.closest('a[href]')
  if (!(anchor instanceof HTMLAnchorElement)) return false
  if (anchor.target && anchor.target !== '_self') return false
  if (anchor.hasAttribute('download')) return false

  const url = new URL(anchor.href, window.location.href)
  return url.origin === window.location.origin && url.href !== window.location.href
}

export default function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setVisible(false)

    if (showTimer.current) clearTimeout(showTimer.current)
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }, [pathname])

  useEffect(() => {
    const start = (event: MouseEvent) => {
      if (!isInternalNavigation(event)) return

      if (showTimer.current) clearTimeout(showTimer.current)
      if (hideTimer.current) clearTimeout(hideTimer.current)

      showTimer.current = setTimeout(() => {
        setVisible(true)
      }, SHOW_DELAY_MS)

      hideTimer.current = setTimeout(() => {
        setVisible(false)
      }, MAX_VISIBLE_MS)
    }

    document.addEventListener('click', start, true)

    return () => {
      document.removeEventListener('click', start, true)
      if (showTimer.current) clearTimeout(showTimer.current)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className={[
        'pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2px] overflow-hidden transition-opacity duration-150',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <div className="navigation-progress-bar h-full w-1/3 bg-[#f4b942]" />
    </div>
  )
}
