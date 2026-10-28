/**
 * Startapus Browser — client half: tab type + tab body.
 *
 * The tab body owns a real Electron `<webview>` guest. A picked page element is
 * handed to the session composer through the optional `sessions`/`conversation`
 * services, injected lazily so the tab still works when they are unavailable.
 *
 * @module startapus-browser/client
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import { StartapusBrowserPanel } from './panel.tsx'
import { elementSource, insertElementRef, type ElementPick } from './element-refs.ts'
import { noteShortcutState, requestOpenTab, shortcutHint, startEngine } from './engine'
import { markTabClosing, registerTabsCloseHandler } from './tabs'
import { setTabsApi } from './tabs'
import { useTabTitle } from './tab-titles'
import type { PickResult } from './panel.tsx'

/** Stable tab id and kind. */
const TAB_ID = 'startapus-browser'
const TAB_KIND = 'startapus-browser'

/** Client-side services required for the tab itself. */
export const inject = ['slots', 'sidebarRightTabs']

/** Props composed into the tab body by the sidebar. */
interface TabBodyProps {
  sessionId?: string
}

/** Startapus Browser mark: a browser window with the brand smile. */
function StartapusMark({ size = 14 }: { size?: number }): React.ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flex: 'none' }}
    >
      <rect x="1.6" y="2.6" width="12.8" height="10.8" rx="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.9 6.1h12.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="3.9" cy="4.35" r="0.65" fill="currentColor" />
      <circle cx="5.9" cy="4.35" r="0.65" fill="currentColor" />
      <path d="M5.2 10.1c0.45 0.9 1.6 1.5 2.8 1.5s2.35-0.6 2.8-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

/** Larger brand artwork shown on the «add tab» cards. */
function StartapusArtwork(): React.ReactNode {
  return (
    <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="4.5" y="7.5" width="39" height="33" rx="9" stroke="currentColor" strokeWidth="2.6" opacity="0.85" />
      <path d="M5.2 17h37.6" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      <circle cx="11" cy="12.2" r="1.9" fill="#6DED6B" />
      <circle cx="17.2" cy="12.2" r="1.9" fill="#6DED6B" />
      <path d="M15 27c1.7 3.1 4.8 5 9 5s7.3-1.9 9-5" stroke="#6DED6B" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/** Compact tab title: mark + the page the tab currently holds. */
function StartapusTabTitle(props: { useTabInfo?: () => { tab?: { id?: unknown } } }): React.ReactNode {
  let tabId: string | undefined
  try {
    const info = typeof props?.useTabInfo === 'function' ? props.useTabInfo() : undefined
    tabId = typeof info?.tab?.id === 'string' ? info.tab.id : undefined
  } catch {
    tabId = undefined
  }
  let pageTitle = ''
  try {
    pageTitle = useTabTitle(tabId)
  } catch {
    // A closing tab must never take the strip down with it.
    pageTitle = ''
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0, maxWidth: '100%' }}>
      <StartapusMark />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {pageTitle === '' ? 'Startapus' : pageTitle}
      </span>
    </span>
  )
}

/**
 * Register the tab type and its body.
 * @param ctx - client context.
 */
export function apply(ctx: ClientContext): void {
  // `sidebarRight` is a service, so it must be injected before use — reading it
  // off the apply context throws. Lazy injection keeps activation safe and hands
  // us a context where `openTab` actually works.
  ctx.inject(['sidebarRight'], (inner: ClientContext) => {
    try {
      setTabsApi(inner)
    } catch {
      // tab control is optional; never let it break activation
    }
  })

  ctx.inject(['sidebarRightTabs'], (inner: ClientContext) => {
    try {
      setTabsApi(inner)
    } catch {
      // same: optional
    }
  })

  // The kernel tells us before it closes a tab of our kind. Only mark it: the
  // panel's unmount disposes the session, and the kernel owns the lease.
  try {
    registerTabsCloseHandler(TAB_ID, (tabId) => markTabClosing(tabId))
  } catch {
    // optional
  }

  // Working handler first: capture-phase keydown, ignored inside text inputs.
  // Cmd+T was freed by disabling the built-in browser.
  try {
    const onKeyDown = (event: KeyboardEvent): void => {
      const modifier = event.metaKey || event.ctrlKey
      if (!modifier || event.altKey || event.shiftKey) return
      if (event.key.toLowerCase() !== 't') return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase() ?? ''
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable === true) return
      event.preventDefault()
      requestOpenTab()
    }
    window.addEventListener('keydown', onKeyDown, true)
    ctx.effect(() => () => window.removeEventListener('keydown', onKeyDown, true), 'startapus-browser: shortcut listener')
  } catch {
    // must never break activation
  }

  // Register the command in the shortcuts catalog (that is what draws the key on
  // the guide card). `register` throws on reserved/conflicting defaults, so try a
  // short list and report which one the kernel actually accepted.
  try {
    ctx.inject(['shortcuts'], (scope: ClientContext) => {
      const service = (scope as unknown as {
        shortcuts?: {
          register?: (command: Record<string, unknown>) => () => void
        }
      }).shortcuts
      if (service === undefined || typeof service.register !== 'function') {
        noteShortcutState({ id: 'startapus-browser.new', keys: '', ok: false, error: 'servicio shortcuts недоступен' })
        return
      }
      const candidates: Array<{ keys: string; defaults: Record<string, { code: string; modifiers: string[] }> }> = [
        { keys: 'Cmd+T', defaults: { 'desktop:macos': { code: 'KeyT', modifiers: ['primary'] } } },
        { keys: 'Cmd+Shift+T', defaults: { 'desktop:macos': { code: 'KeyT', modifiers: ['primary', 'shift'] } } },
        { keys: 'Cmd+Alt+B', defaults: { 'desktop:macos': { code: 'KeyB', modifiers: ['primary', 'alt'] } } },
        { keys: 'Cmd+Shift+B', defaults: { 'desktop:macos': { code: 'KeyB', modifiers: ['primary', 'shift'] } } },
      ]
      let registered = false
      let lastError = ''
      for (const candidate of candidates) {
        try {
          scope.effect(() => service.register?.({
            id: 'startapus-browser.new',
            label: () => 'Открыть Startapus Browser',
            aliases: ['startapus', 'browser', 'открыть браузер'],
            defaults: candidate.defaults,
            regions: ['page', 'editable'],
            modals: [],
            resolve: () => ({ status: 'handled', run: () => { requestOpenTab() } }),
          }) ?? (() => undefined), 'startapus-browser: shortcut')
          noteShortcutState({ id: 'startapus-browser.new', keys: candidate.keys, ok: true, error: '' })
          registered = true
          break
        } catch (error) {
          lastError = String(error instanceof Error ? error.message : error)
        }
      }
      if (!registered) {
        noteShortcutState({ id: 'startapus-browser.new', keys: '', ok: false, error: lastError })
      }
    })
  } catch (error) {
    noteShortcutState({ id: 'startapus-browser.new', keys: '', ok: false, error: String(error) })
  }

  try {
    startEngine()
  } catch {
    // the engine is optional for activation; panels start it on demand
  }

  let composer: ClientContext | undefined
  ctx.inject(['sessions', 'conversation'], (inner: ClientContext) => {
    try {
      composer = inner
    } catch {
      // composer wiring is optional
    }
  })

  // The composer resolves every chip through its owning source codec; without
  // this registration submitting a draft fails with
  // `slash: no serializer for reference source "startapus-element"`.
  ctx.inject(['inputTriggers'], (inner: ClientContext) => {
    try {
      const registry = (inner as unknown as {
        inputTriggers?: { registerSource(source: unknown): () => void }
      }).inputTriggers
      if (registry === undefined || typeof registry.registerSource !== 'function') return
      ctx.effect(() => registry.registerSource(elementSource()), 'startapus-browser: element source')
    } catch {
      // chip serialization stays optional; the tab must not fail activation
    }
  })

  const definition = {
    id: TAB_ID,
    kind: TAB_KIND,
    // Several Startapus tabs may coexist, like the built-in browser.
    multiple: true,
    // Sidebar keeps the DOM of an inactive tab mounted; without it a panel stops
    // polling as soon as another tab is focused.
    keepMounted: true,
    priority: 'extension' as const,
    title: () => 'Startapus Browser',
    guide: [{
      id: 'new',
      commandId: 'startapus-browser.new',
      order: 10,
      title: () => 'Startapus Browser',
      description: () => {
        const hint = shortcutHint()
        return hint === ''
          ? 'Браузер в правой панели: любые сайты, выделение элементов, агентские инструменты'
          : `${hint} · браузер в правой панели: любые сайты, выделение элементов`
      },
      icon: StartapusArtwork,
    }],
  }

  ctx.effect(() => {
    // The kernel keeps desktop browser tabs mounted so a guest survives tab
    // switches. If this build rejects the flag, registration still happens
    // without it instead of losing the tab.
    return ctx.sidebarRightTabs.register(definition)
  }, 'startapus-browser: tab type')

  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () =>
    ctx.slots.register({
      name: 'sidebar.right.pane.tab',
      key: TAB_ID,
    }, (props: TabBodyProps) => {
      // The slot composes `useTabInfo`; it gives the instance id and navigation
      // params, so several tabs stay distinguishable and a new tab can start on
      // a requested URL.
      const useTabInfo = (props as { useTabInfo?: () => { tab?: { id?: unknown; navigation?: { params?: Record<string, unknown> } } } }).useTabInfo
      let info: { tab?: { id?: unknown; navigation?: { params?: Record<string, unknown> } } } | undefined
      try {
        info = typeof useTabInfo === 'function' ? useTabInfo() : undefined
      } catch {
        info = undefined
      }
      const tabId = typeof info?.tab?.id === 'string' ? info.tab.id : undefined
      const params = info?.tab?.navigation?.params
      const requestedUrl = typeof params?.url === 'string' ? params.url : undefined
      // The kernel tells us whether this tab is on screen; activation must follow
      // that flag, otherwise the last mounted panel wins and switching back to an
      // earlier tab shows an empty pane.
      const tabVisible = (info?.tab as { visible?: unknown } | undefined)?.visible === true
      const actions = (props as {
        actions?: {
          closeTab?: (sessionId: string, tabId: string) => void
          openTab?: (kind: string, options?: { params?: Record<string, unknown>; revealIfOpened?: boolean }) => unknown
          focusTab?: (sessionId: string, tabId: string) => unknown
        }
      }).actions
      const sessionId = props?.sessionId
      const onClose = (): boolean => {
        try {
          if (actions?.closeTab === undefined || typeof sessionId !== 'string' || tabId === undefined) return false
          actions.closeTab(sessionId, tabId)
          return true
        } catch {
          return false
        }
      }
      const onOpenTab = (url: string): boolean => {
        try {
          if (actions?.openTab === undefined) return false
          actions.openTab(TAB_KIND, url === '' ? {} : { params: { url } })
          return true
        } catch {
          return false
        }
      }
      const onFocusTab = (target: string): boolean => {
        try {
          if (actions?.focusTab === undefined || typeof sessionId !== 'string') return false
          actions.focusTab(sessionId, target)
          return true
        } catch {
          return false
        }
      }
      return (
      <StartapusBrowserPanel
        tabKey={tabId}
        visible={tabVisible}
        onClose={onClose}
        onOpenTab={onOpenTab}
        onFocusTab={onFocusTab}
        params={requestedUrl === undefined ? undefined : { url: requestedUrl }}
        sessionId={props?.sessionId}
        onPick={(pick: ElementPick): PickResult => {
          const sessionId = props?.sessionId
          if (composer === undefined) return { ok: false, reason: 'композер ещё не подключён' }
          if (typeof sessionId !== 'string' || sessionId === '') {
            return { ok: false, reason: 'нет активной сессии' }
          }
          try {
            return { ok: true, label: insertElementRef(composer, sessionId, pick) }
          } catch (error) {
            return { ok: false, reason: String(error) }
          }
        }}
      />
      )
    }),
  ), 'startapus-browser: tab body')

  // The strip renders a custom title (logo + name) through this seat; if the
  // build does not expose it, the plain `title` above stays in effect.
  ctx.effect(() => {
    try {
      return ctx.slots.inject('sidebar.right.pane.tab.title', () =>
        ctx.slots.register({
          name: 'sidebar.right.pane.tab.title',
          key: TAB_ID,
        }, StartapusTabTitle),
      )
    } catch {
      return undefined
    }
  }, 'startapus-browser: tab title')
}
