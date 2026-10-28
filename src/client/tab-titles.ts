/**
 * Page titles per Startapus tab.
 *
 * The kernel has no `setTabTitle`: the built-in browser listens to
 * `page-title-updated` on its guest and keeps the title in its own store. We do
 * the same — the panel publishes the guest title here and the strip's title slot
 * subscribes, so a tab shows the page it currently holds.
 *
 * @module startapus-browser/client/tab-titles
 */

import { useEffect, useState } from 'react'

const titles = new Map<string, string>()
const listeners = new Set<() => void>()

/** Publish the page title for one tab. */
export function setTabTitle(key: string, title: string): void {
  if (typeof key !== 'string' || key === '') return
  const next = (title ?? '').trim().replace(/\s+/g, ' ').slice(0, 80)
  if ((titles.get(key) ?? '') === next) return
  titles.set(key, next)
  for (const listener of listeners) listener()
}

/** Current published title for one tab ('' when unknown). */
export function getTabTitle(key: string): string {
  if (typeof key !== 'string' || key === '') return ''
  return titles.get(key) ?? ''
}

/** Subscribe to any title change. */
export function subscribeTitles(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React binding: re-render when this tab's title changes. */
export function useTabTitle(key: string | undefined): string {
  const [value, setValue] = useState(() => getTabTitle(key ?? ''))
  useEffect(() => {
    setValue(getTabTitle(key ?? ''))
    return subscribeTitles(() => setValue(getTabTitle(key ?? '')))
  }, [key])
  return value
}
