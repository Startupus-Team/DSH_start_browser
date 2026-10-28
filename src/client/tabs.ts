/**
 * Client-side tab control.
 *
 * DSH exposes `ctx.sidebarRight.openTab(kind, { params })` to client plugins, so
 * the panel can ask the kernel to open another Startapus tab — the agent-driven
 * equivalent of clicking "+" in the tab strip.
 *
 * The context is stored without touching its properties: reading an
 * un-injected service (cordis proxy) throws, and an exception inside `apply`
 * takes down the whole plugin registration.
 *
 * @module startapus-browser/client/tabs
 */

let context: unknown = null

/** Remember the client context; never reads its services here. */
export function setTabsApi(source: unknown): void {
  context = source
}

interface OpenTabController {
  openTab?: (kind: string, options?: { params?: Record<string, unknown> }) => unknown
}

/** Resolve the navigation controller without tripping cordis inject guards. */
function controller(): OpenTabController | undefined {
  const source = context as {
    get?: (name: string) => unknown
    sidebarRight?: OpenTabController
  } | null
  if (source === null || source === undefined) return undefined
  // `ctx.get(name)` returns a service without requiring the plugin to inject it;
  // reading `ctx.sidebarRight` directly throws "cannot get property ... without inject".
  if (typeof source.get === 'function') {
    try {
      const service = source.get('sidebarRight') as OpenTabController | undefined
      if (service !== undefined && service !== null) return service
    } catch {
      // fall through to direct access
    }
  }
  try {
    return source.sidebarRight
  } catch {
    return undefined
  }
}

/** Open one more Startapus tab, optionally on a URL. Never throws. */
export function openStartapusTab(kind: string, params: Record<string, unknown> = {}): { opened: boolean; error: string } {
  try {
    const api = controller()
    if (api === undefined) return { opened: false, error: 'sidebarRight недоступен' }
    if (typeof api.openTab !== 'function') return { opened: false, error: 'openTab не функция' }
    api.openTab(kind, { params })
    return { opened: true, error: '' }
  } catch (error) {
    return { opened: false, error: String(error instanceof Error ? error.message : error) }
  }
}

/* ------------------------------------------------------------------ *
 * Close handlers: the kernel calls the registered handler *before* it
 * closes a tab of this kind. The built-in browser releases its guest
 * there; doing it only on unmount is too late for our pane.
 * ------------------------------------------------------------------ */

const releasers = new Map<string, () => void>()

/**
 * Tabs the kernel is closing right now. Their panel must NOT release the lease
 * itself: the kernel tears the guest down, and a second release used to wipe the
 * whole guest pool (every remaining tab went blank).
 */
const closingTabs = new Set<string>()

/** Panel publishes how its guest is released. */
export function registerLeaseReleaser(tabKey: string, release: () => void): () => void {
  if (typeof tabKey !== 'string' || tabKey === '') return () => undefined
  releasers.set(tabKey, release)
  return () => {
    if (releasers.get(tabKey) === release) releasers.delete(tabKey)
  }
}

/** Remember that the kernel is closing this tab. */
export function markTabClosing(tabKey: string): void {
  if (typeof tabKey === 'string' && tabKey !== '') closingTabs.add(tabKey)
}

/** True while the kernel owns the teardown of this tab. */
export function isTabClosing(tabKey: string): boolean {
  return typeof tabKey === 'string' && closingTabs.has(tabKey)
}

/** Drop the closing mark once the panel is gone. */
export function forgetClosing(tabKey: string): void {
  closingTabs.delete(tabKey)
}

/** Release the guest of a tab that the kernel is about to close. */
export function releaseLeaseFor(tabKey: string): boolean {
  const release = releasers.get(tabKey)
  if (release === undefined) return false
  releasers.delete(tabKey)
  try {
    release()
    return true
  } catch {
    return false
  }
}

/** Register our close handler with the navigation controller, if exposed. */
export function registerTabsCloseHandler(kind: string, handler: (tabId: string) => void): boolean {
  try {
    const source = context as {
      get?: (name: string) => unknown
      sidebarRight?: { registerCloseHandler?: (k: string, h: (sessionId: string, tab: { id: string }) => void) => void }
    } | null
    if (source === null || source === undefined) return false
    const service = typeof source.get === 'function'
      ? (source.get('sidebarRight') as { registerCloseHandler?: (k: string, h: (s: string, t: { id: string }) => void) => void } | undefined)
      : source.sidebarRight
    if (service === undefined || typeof service.registerCloseHandler !== 'function') return false
    service.registerCloseHandler(kind, (_sessionId, tab) => {
      try {
        handler(String(tab?.id ?? ''))
      } catch {
        // never throw into the kernel
      }
    })
    return true
  } catch {
    return false
  }
}

/** Front a Startapus tab through the navigation controller (`focus(tabId)`). */
export function focusStartapusTab(tabId: string): boolean {
  try {
    const source = context as {
      get?: (name: string) => unknown
      sidebarRight?: { focus?: (id: string) => unknown }
    } | null
    if (source === null || source === undefined) return false
    const service = typeof source.get === 'function'
      ? (source.get('sidebarRight') as { focus?: (id: string) => unknown } | undefined)
      : source.sidebarRight
    if (service === undefined || service === null || typeof service.focus !== 'function') return false
    service.focus(tabId)
    return true
  } catch {
    return false
  }
}
