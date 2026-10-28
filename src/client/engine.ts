/**
 * Startapus Browser engine.
 *
 * Owns everything that must outlive a React component: one `<webview>` guest per
 * Startapus tab (in its own fixed container), the desktop lease, and the single
 * long-poll channel the agent talks to. Panels are thin views that only report
 * their rectangle and render chrome, so switching/closing/unmounting a tab can
 * never kill the channel or another tab's page.
 *
 * @module startapus-browser/client/engine
 */

import type { ElementPick } from './element-refs.ts'
import { actScript, coverageScript, evidenceScript, measureScript, pageScanScript } from './verify-scripts'
import { cropRect as clampCropRect, pickSessionToEvict, verifyNeedsReload, verifySettleMs } from './rules'
import { openStartapusTab } from './tabs'
import { setTabTitle } from './tab-titles'
import { poll, probe, report, setTab } from './transport'

/** A webview element plus the Electron methods we call. */
export interface GuestElement extends HTMLElement {
  loadURL?: (url: string) => void
  getURL?: () => string
  getTitle?: () => string
  reload?: () => void
  goBack?: () => void
  goForward?: () => void
  canGoBack?: () => boolean
  canGoForward?: () => boolean
  setZoomFactor?: (factor: number) => void
  getZoomFactor?: () => number
  capturePage?: (rect?: { x: number; y: number; width: number; height: number }) => Promise<{
    toDataURL?: () => string
    getSize?: () => { width: number; height: number }
  }>
  executeJavaScript?: (code: string, userGesture?: boolean) => Promise<unknown>
}

interface DesktopBridge {
  acquire: (workspace: string) => Promise<{ lease: string; partition: string }>
  release: (lease: string) => Promise<void>
}

interface Session {
  tabId: string
  container: HTMLDivElement
  guest: GuestElement | null
  lease: string | null
  url: string
  title: string
  scrollY: number
  lastActiveAt: number
  ready: boolean
  /** The first navigation already happened; later dom-ready events must not repeat it. */
  navigated: boolean
}

export interface EngineState {
  stage: string
  status: string
  activeTab: string | null
  tabs: number
  url: string
  hasGuest: boolean
  counters: { acquires: number; releases: number; attachFailures: number; recoveries: number; panics: number }
  panels: number
}

const WORKSPACE_KEY = 'startapus-browser'
/** Guests are expensive: keep the pool small and drop idle pages. */
const MAX_SESSIONS = 6
const SESSION_IDLE_MS = 15 * 60 * 1000
const START_URL = 'https://ya.ru/'

const sessions = new Map<string, Session>()
/** In-flight creations, so a re-render cannot acquire several leases. */
const pending = new Map<string, Promise<Session | null>>()
const consoleRing: Array<{ level: number; message: string }> = []
const counters = { acquires: 0, releases: 0, attachFailures: 0, recoveries: 0, panics: 0 }

let evidence: ElementPick | null = null
let crop: { bytes: number; width: number; height: number; base64?: string } | null = null
let area: unknown = null
let status = 'подготовка guest…'
let stage = 'ready'
let activeTabId: string | null = null
let loopStarted = false
let misses = 0
let base: string | null = null
let closeRequested: () => boolean = () => false
let pickRequested: () => void = () => undefined
const listeners = new Set<() => void>()
/** How many panes are currently mounted — a pane is the only place a guest can live. */
let mountedPanels = 0

/** Read the browser bridge exposed by the DSH desktop preload. */
function browserBridge(): DesktopBridge | undefined {
  const desktop = (window as unknown as { dshDesktop?: { browser?: DesktopBridge } }).dshDesktop
  return desktop?.browser
}

/** Current engine snapshot for views. */
/** Register a mounted pane (called by the view on mount/unmount). */
export function notePanelMounted(): void {
  mountedPanels += 1
  notify()
}

/** Unregister a mounted pane. */
export function notePanelUnmounted(): void {
  mountedPanels = Math.max(0, mountedPanels - 1)
  notify()
}

/** Panes currently mounted. */
export function panelsMounted(): number {
  return mountedPanels
}

export function engineState(): EngineState {
  return {
    stage,
    status,
    activeTab: activeTabId,
    tabs: sessions.size,
    url: activeTabId === null ? '' : (sessions.get(activeTabId)?.url ?? ''),
    hasGuest: activeGuest() !== null,
    counters: { ...counters },
  }
}

/** Subscribe to engine changes (status, url, stage). */
export function subscribeEngine(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify(): void {
  for (const listener of listeners) {
    try {
      listener()
    } catch {
      // a view must not break the engine
    }
  }
}

/** Update the human-readable status line. */
export function setStatus(next: string): void {
  status = next
  notify()
}

/** Guest of the active tab, if any. */
export function activeGuest(): GuestElement | null {
  const current = activeTabId === null ? undefined : sessions.get(activeTabId)
  if (current?.guest !== undefined && current?.guest !== null) return current.guest
  // A ghost session (dead guest, no DOM) must not hide a healthy one.
  for (const session of sessions.values()) {
    if (session.guest !== null) {
      activeTabId = session.tabId
      return session.guest
    }
  }
  return null
}

/** Guest of one tab. */
export function guestOf(tabId: string): GuestElement | null {
  return sessions.get(tabId)?.guest ?? null
}

/** Picker result published by the panel view. */
export function setEvidence(pick: ElementPick | null): void {
  evidence = pick
}

/** Picker/crop request hooks installed by the view. */
export function setViewHooks(hooks: { closeRequested?: () => boolean; pickRequested?: () => void }): void {
  if (hooks.closeRequested !== undefined) closeRequested = hooks.closeRequested
  if (hooks.pickRequested !== undefined) pickRequested = hooks.pickRequested
}

function memoryOf(session: Session | undefined): { url: string; scrollY: number; restoreScroll: boolean } {
  return {
    url: session?.url ?? '',
    scrollY: session?.scrollY ?? 0,
    restoreScroll: false,
  }
}

function memory(): { url: string; scrollY: number; restoreScroll: boolean } {
  return memoryOf(activeTabId === null ? undefined : sessions.get(activeTabId))
}

/** Place one container over the panel rectangle. */
function position(session: Session, visible: boolean): void {
  session.container.style.display = visible ? 'flex' : 'none'
  if (!visible) return
  // Showing a previously hidden guest needs a layout nudge.
  window.requestAnimationFrame(() => {
    try {
      void session.guest?.executeJavaScript?.('window.dispatchEvent(new Event("resize"))', false)
    } catch {
      // ignore: guest may be gone
    }
  })
}

/** Create the guest of one tab (lazily, on first activation). */
async function ensureSession(tabId: string, initialUrl: string, host: HTMLElement | null): Promise<Session | null> {
  const existing = sessions.get(tabId)
  if (existing !== undefined) return existing
  const inFlight = pending.get(tabId)
  if (inFlight !== undefined) return inFlight
  const creation = createSession(tabId, initialUrl, host).finally(() => pending.delete(tabId))
  pending.set(tabId, creation)
  return creation
}

/** Actual guest creation; `ensureSession` de-duplicates concurrent calls. */
async function createSession(tabId: string, initialUrl: string, host: HTMLElement | null): Promise<Session | null> {

  // Reclaim the least recently used page before the pool grows.
  const evict = pickSessionToEvict([...sessions.values()], MAX_SESSIONS)
  if (evict !== null && closeSession(evict)) {
    setStatus(`вкладка ${evict}: страница выгружена (лимит ${MAX_SESSIONS})`)
  }

  const bridge = browserBridge()
  if (bridge === undefined) {
    setStatus('desktop bridge недоступен: гость не создан')
    return null
  }

  const container = document.createElement('div')
  // A hidden (<webview>) is laid out at zero height and does not reflow when it
  // becomes visible, which showed up as a page strip over an empty pane. Create
  // it visible and let activation hide the other sessions.
  container.style.cssText = 'display:flex;flex-direction:column;flex:1 1 auto;min-height:0;width:100%;height:100%;overflow:hidden;border:none;'
  // The guest must live inside the pane's DOM: the kernel paints the guest where
  // its element sits, so a body-level container shows up as an empty box.
  const mount = host ?? document.body
  mount.appendChild(container)

  const session: Session = {
    tabId,
    container,
    guest: null,
    lease: null,
    url: initialUrl,
    title: '',
    scrollY: 0,
    lastActiveAt: Date.now(),
    ready: false,
    navigated: false,
  }
  sessions.set(tabId, session)
  notify()

  try {
    counters.acquires += 1
    setStatus('запрос резервации guest…')
    const reservation = await bridge.acquire(WORKSPACE_KEY)
    session.lease = reservation.lease
    setStatus(`резервация ok · partition ${reservation.partition}`)
    void report(base ?? (await probe()) ?? '', {}).catch(() => undefined)

    const created = document.createElement('webview') as GuestElement
    created.dataset.sidebarBrowserFrame = 'webview'
    created.setAttribute('name', reservation.lease)
    created.setAttribute('partition', reservation.partition)
    created.setAttribute('allowpopups', '')
    created.setAttribute('src', `about:blank#${reservation.lease}`)
    created.style.cssText = 'display:flex;flex:1 1 auto;min-height:0;width:100%;height:100%;border:none;'

    created.addEventListener('dom-ready', () => {
      session.ready = true
      // `dom-ready` fires for every document, so navigating here unconditionally
      // makes the page reload forever. Navigate exactly once.
      if (session.navigated) {
        notify()
        return
      }
      session.navigated = true
      const remembered = session.url.startsWith('about:blank') ? '' : session.url
      const target = remembered === '' ? initialUrl : remembered
      created.loadURL?.(target)
      setStatus(`guest подключён: ${target}`)
      notify()
    })
    created.addEventListener('did-navigate', () => onNavigate(session, created))
    created.addEventListener('did-navigate-in-page', () => onNavigate(session, created))
    created.addEventListener('page-title-updated', () => onTitle(session, created))
    created.addEventListener('console-message', (event: Event) => {
      const detail = (event as CustomEvent<{ level?: number; message?: string }>).detail
      consoleRing.push({
        level: typeof detail?.level === 'number' ? detail.level : 0,
        message: String(detail?.message ?? '').slice(0, 300),
      })
      while (consoleRing.length > 30) consoleRing.shift()
    })
    created.addEventListener('did-fail-load', (event: Event) => {
      const detail = (event as CustomEvent<{ errorCode?: number; errorDescription?: string; validatedURL?: string }>).detail
      if (detail?.errorCode === -3) return
      setStatus(`ошибка ${detail?.errorCode ?? ''} ${detail?.errorDescription ?? ''}`)
    })

    container.appendChild(created)
    session.guest = created
    notify()

    window.setTimeout(() => {
      if (session.ready || session.guest === null) return
      counters.attachFailures += 1
      setStatus('guest не подключился: ядро отклонило attach')
    }, 4000)

    return session
  } catch (error) {
    counters.attachFailures += 1
    setStatus(`acquire упал: ${String(error)}`)
    container.remove()
    sessions.delete(tabId)
    notify()
    return null
  }
}

function onNavigate(session: Session, guest: GuestElement): void {
  try {
    const url = String(guest.getURL?.() ?? session.url)
    if (!url.startsWith('about:blank')) session.url = url
    setTabTitle(session.tabId, session.title === '' ? session.url : session.title)
    notify()
  } catch {
    // destroyed guest
  }
}

function onTitle(session: Session, guest: GuestElement): void {
  try {
    const title = typeof guest.getTitle === 'function' ? guest.getTitle() : ''
    session.title = title
    setTabTitle(session.tabId, title === '' ? session.url : title)
    notify()
  } catch {
    // destroyed guest
  }
}

/** Activate one tab: its container becomes visible over `rect`. */
export async function activateSession(tabId: string, initialUrl: string, host: HTMLElement | null): Promise<void> {
  setTab(tabId)
  activeTabId = tabId
  const known = sessions.get(tabId)
  if (known !== undefined) known.lastActiveAt = Date.now()
  const session = known ?? (await ensureSession(tabId, initialUrl === '' ? START_URL : initialUrl, host))
  for (const other of sessions.values()) {
    if (other.tabId !== tabId) position(other, false)
  }
  if (session !== null) position(session, true)
  notify()
}

/** Bring one tab to the front (the kernel says this tab is visible now). */
export async function showSession(tabId: string, initialUrl: string, host: HTMLElement | null): Promise<void> {
  activeTabId = tabId
  const known = sessions.get(tabId)
  if (known !== undefined && (known.guest === null || !known.container.isConnected)) {
    // The pane DOM was replaced (plugin reload, remount): the guest inside the
    // detached container is dead, so forget the zombie session and build a new one.
    sessions.delete(tabId)
  }
  const session = sessions.get(tabId) ?? (await ensureSession(tabId, initialUrl === '' ? START_URL : initialUrl, host))
  for (const other of sessions.values()) {
    if (other.tabId !== tabId) position(other, false)
  }
  if (session !== null) {
    session.lastActiveAt = Date.now()
    position(session, true)
  }
  notify()
}

/** The kernel says this tab is hidden: hide its container but keep the page. */
export function hideSession(tabId: string): void {
  const session = sessions.get(tabId)
  if (session === undefined) return
  position(session, false)
  if (activeTabId === tabId) activeTabId = null
  notify()
}

/** Move the active container when the panel resizes or scrolls. */
export function setSessionRect(tabId: string, visible: boolean): void {
  const session = sessions.get(tabId)
  if (session === undefined) return
  position(session, visible && activeTabId === tabId)
}

/** The panel of this tab unmounted: hide its container, keep the guest alive. */
export function detachSession(tabId: string): void {
  const session = sessions.get(tabId)
  if (session === undefined) return
  session.container.style.display = 'none'
  if (activeTabId === tabId) activeTabId = null
  notify()
}

/** Close one tab for real: destroy the container and release the lease. */
export function closeSession(tabId: string): boolean {
  const session = sessions.get(tabId)
  if (session === undefined) return false
  sessions.delete(tabId)
  try {
    session.container.remove()
  } catch {
    // already gone
  }
  if (activeTabId === tabId) activeTabId = null
  const bridge = browserBridge()
  if (session.lease !== null && bridge !== undefined) {
    counters.releases += 1
    void bridge.release(session.lease).catch(() => undefined)
  }
  notify()
  return true
}

/** Forget a session whose tab the kernel closed; the kernel owns its lease. */
export function disposeSession(tabId: string): boolean {
  const session = sessions.get(tabId)
  if (session === undefined) return false
  sessions.delete(tabId)
  try {
    session.container.remove()
  } catch {
    // already gone
  }
  if (activeTabId === tabId) activeTabId = null
  notify()
  return true
}

/** Drop pages nobody looked at for a while. */
function collectIdleSessions(): void {
  const now = Date.now()
  for (const session of [...sessions.values()]) {
    // The pane DOM is gone (tab closed/remounted): the guest is dead and the
    // session would only confuse activation and capture.
    if (!session.container.isConnected) {
      disposeSession(session.tabId)
      continue
    }
    if (session.tabId === activeTabId) continue
    if (now - session.lastActiveAt < SESSION_IDLE_MS) continue
    closeSession(session.tabId)
  }
}

/** Tabs the engine knows about. */
export function listSessions(): Array<{ tabId: string; url: string; title: string }> {
  return [...sessions.values()].map((session) => ({ tabId: session.tabId, url: session.url, title: session.title }))
}

/** Execute code in the active guest. */
export async function runInActive(code: string, timeoutMs = 5000): Promise<unknown> {
  const guest = activeGuest()
  if (guest === null || guest.executeJavaScript === undefined) {
    throw new Error('E_NO_GUEST: гость не создан')
  }
  return withTimeout(guest.executeJavaScript(code, false), timeoutMs, 'E_TIMEOUT')
}

/** Reject when a page-side script does not answer in time. */
export function withTimeout<T>(promise: Promise<T>, ms: number, code: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(code)), ms)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error instanceof Error ? error : new Error(String(error)))
      },
    )
  })
}




/** Crop a captured data URL to a page-space rectangle. */
async function cropDataUrl(
  dataUrl: string,
  rect: { x: number; y: number; width: number; height: number },
  guest: GuestElement,
): Promise<string> {
  let viewportWidth = 0
  try {
    const raw = await guest.executeJavaScript?.('String(window.innerWidth)', false)
    viewportWidth = Number.parseInt(typeof raw === 'string' ? raw : '', 10) || 0
  } catch {
    viewportWidth = 0
  }
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('E_CROP_DECODE'))
    element.src = dataUrl
  })
  const ratio = viewportWidth > 0 ? image.width / viewportWidth : 1
  const { sx, sy, sw, sh } = clampCropRect(rect, ratio, { width: image.width, height: image.height })
  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  const context = canvas.getContext('2d')
  if (context === null) throw new Error('E_CROP_CONTEXT')
  context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh)
  return canvas.toDataURL('image/png')
}

/** Capture with a retry and a full-screen fallback cropped by canvas. */
async function capturePageDataUrl(
  guest: GuestElement,
  rect: { x: number; y: number; width: number; height: number } | undefined,
): Promise<{ dataUrl: string; source: string }> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const image = await guest.capturePage?.(rect)
      const dataUrl = image?.toDataURL?.()
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
        const size = image?.getSize?.()
        const wide = size !== undefined ? size.width : 0
        const tall = size !== undefined ? size.height : 0
        // A degenerate capture (e.g. 164x1) looks like success but carries no
        // pixels; fall through to the full capture + canvas crop below.
        const usable = rect === undefined
          ? wide >= 2 && tall >= 2
          : wide >= 2 && tall >= 2 && tall >= Math.min(4, rect.height - 2)
        if (usable || size === undefined) {
          return { dataUrl, source: attempt === 0 ? 'guest' : 'guest-retry' }
        }
      }
    } catch {
      // fall through to the full-screen fallback
    }
  }
  const full = await guest.capturePage?.(undefined)
  const fullUrl = full?.toDataURL?.()
  if (typeof fullUrl !== 'string' || !fullUrl.startsWith('data:image/')) {
    throw new Error('E_CAPTURE_EMPTY')
  }
  if (rect === undefined) return { dataUrl: fullUrl, source: 'full' }
  return { dataUrl: await cropDataUrl(fullUrl, rect, guest), source: 'canvas-crop' }
}

/** Start the single agent channel (idempotent). */
export function startEngine(): void {
  if (loopStarted) return
  loopStarted = true
    const tick = async (): Promise<void> => {
      try {
        await tickOnce()
      } catch (error) {
        // One bad report must never kill the poll loop: that leaves the tab
        // connected but deaf to agent commands.
        setStatus(`цикл: ${String(error)}`)
      }
    }
    const tickOnce = async (): Promise<void> => {
      if (base === null) {
        const found = await probe()
          if (found === null) {
          misses += 1
          if (misses === 3) setStatus('канал с агентом недоступен: маршрут плагина не отвечает')
          return
        }
        base = found
        misses = 0
      }
      const command = await poll(base as string)
      if (command !== null) {
        await report(base as string, { lastCommand: { id: command.id, kind: command.kind, at: Date.now() } })
        if (command.kind === 'open' && typeof command.args.url === 'string') {
          activeGuest()?.loadURL?.(String(command.args.url))
          setStatus(`агент: открываю ${String(command.args.url)}`)
        } else if (command.kind === 'reload') {
          activeGuest()?.reload?.()
          setStatus('агент: перезагрузка')
        } else if (command.kind === 'pick') {
          setStatus('агент: выбор элемента')
          pickRequested()
        } else if (command.kind === 'read_page') {
          const view = activeGuest()
          const limit = Math.min(200, Math.max(10, Number(command.args.limit ?? 120)))
          if (view === null || view.executeJavaScript === undefined) {
            await report(base as string, { pageScan: { error: 'guest не готов' } })
          } else {
            try {
              const raw = await withTimeout(view.executeJavaScript(pageScanScript(limit), false), 8000, 'E_TIMEOUT')
              const parsed = typeof raw === 'string' ? JSON.parse(raw) as { status?: string; total?: number; items?: unknown[]; url?: string; message?: string } : {}
              if (parsed.status === 'OK') {
                await report(base as string, { pageScan: { url: parsed.url ?? '', total: parsed.total ?? 0, items: parsed.items ?? [] } })
                setStatus(`обзор страницы: ${parsed.total ?? 0} узлов`)
              } else {
                await report(base as string, { pageScan: { error: parsed.message ?? 'обзор не удался' } })
              }
            } catch (error) {
              await report(base as string, { pageScan: { error: String(error) } })
            }
          }
        } else if (command.kind === 'act_batch') {
          const view = activeGuest()
          const items = Array.isArray(command.args.items)
            ? command.args.items as Array<{ op: string; selector: string; value: string }>
            : []
          const results: Array<{ op: string; status: string; message: string }> = []
          if (view === null || view.executeJavaScript === undefined) {
            results.push({ op: '-', status: 'ERROR', message: 'guest не готов' })
          } else {
            for (const item of items) {
              try {
                const raw = await withTimeout(view.executeJavaScript(actScript(item.op, item.selector, item.value), false), 5000, 'E_TIMEOUT')
                const parsed = typeof raw === 'string' ? JSON.parse(raw) as { status?: string; message?: string } : {}
                results.push({ op: item.op, status: parsed.status ?? 'ERROR', message: parsed.message ?? '' })
              } catch (error) {
                results.push({ op: item.op, status: 'ERROR', message: String(error) })
              }
              await new Promise((resolve) => setTimeout(resolve, 150))
            }
          }
          await report(base as string, { actResults: results })
          setStatus(`пакет действий: ${results.filter((row) => row.status === 'OK').length}/${results.length} выполнено`)
        } else if (command.kind === 'guest_state') {
          const view = activeGuest()
          if (view === null) {
            await report(base as string, { guestState: { error: 'guest не создан' } })
          } else {
            try {
              const raw = await withTimeout(
                view.executeJavaScript('JSON.stringify({ url: String(location.href), title: String(document.title), readyState: String(document.readyState), textLength: (document.body ? document.body.innerText.length : 0) })', false),
                5000,
                'E_TIMEOUT',
              )
              const parsed = typeof raw === 'string' ? JSON.parse(raw) as Record<string, unknown> : {}
              await report(base as string, { guestState: { ...parsed, getURL: String(view.getURL?.() ?? '') } })
            } catch (error) {
              await report(base as string, { guestState: { error: String(error), getURL: String(view.getURL?.() ?? '') } })
            }
          }
        } else if (command.kind === 'close_tab') {
          const target = activeTabId
          const closed = target === null ? false : closeSession(target) === true
          await report(base as string, { closeTabResult: { closed } })
          if (!closed) setStatus('закрыть вкладку не удалось: нет доступа к actions.closeTab')
        } else if (command.kind === 'new_tab') {
          const target = String(command.args.url ?? '')
          const result = openStartapusTab('startapus-browser', target === '' ? {} : { url: target })
          await report(base as string, { newTabResult: { opened: result.opened, url: target, error: result.error } })
          setStatus(result.opened
            ? `открыта новая вкладка${target === '' ? '' : `: ${target}`}`
            : `новая вкладка не открылась: ${result.error}`)
        } else if (command.kind === 'console_clear') {
          consoleRing.length = 0
          setStatus('консоль очищена')
        } else if (command.kind === 'select') {
          const view = activeGuest()
          const selector = String(command.args.selector ?? '')
          if (view === null || view.executeJavaScript === undefined) {
            setStatus('выбор по селектору: guest не готов')
            await report(base as string, { selectResult: { selector, status: 'ERROR', count: 0 } })
          } else {
            try {
              const raw = await withTimeout(view.executeJavaScript(evidenceScript(selector), false), 5000, 'E_TIMEOUT')
              const parsed = typeof raw === 'string' ? JSON.parse(raw) as { status?: string; evidence?: ElementPick; count?: number; message?: string } : {}
              await report(base as string, { selectResult: { selector, status: parsed.status ?? 'ERROR', count: parsed.count ?? 0 } })
              if (parsed.status === 'OK' && parsed.evidence !== undefined) {
                evidence = parsed.evidence
                await report(base as string, { evidence: parsed.evidence })
                setStatus(`выбран по селектору: ${String(parsed.evidence.selector).slice(0, 80)}`)
              } else if (parsed.status === 'AMBIGUOUS') {
                setStatus(`селектор неоднозначен: найдено ${parsed.count ?? 0}`)
              } else if (parsed.status === 'MISSING') {
                setStatus('селектор ничего не нашёл')
              } else {
                setStatus(`выбор не удался: ${parsed.message ?? ''}`)
              }
            } catch (error) {
              // A silent failure here looks like "the agent's select did nothing".
              setStatus(`выбор по селектору упал: ${String(error)}`)
              await report(base as string, { selectResult: { selector, status: 'ERROR', count: 0 } })
            }
          }
        } else if (command.kind === 'act') {
          const view = activeGuest()
          const op = String(command.args.op ?? '')
          const selector = String(command.args.selector ?? '')
          const value = String(command.args.value ?? '')
          if (view === null || view.executeJavaScript === undefined) {
            setStatus('действие: guest не готов')
          } else {
            try {
              const raw = await withTimeout(view.executeJavaScript(actScript(op, selector, value), false), 5000, 'E_TIMEOUT')
              const parsed = typeof raw === 'string' ? JSON.parse(raw) as { status?: string; op?: string; message?: string } : {}
              await report(base as string, { actResult: { op, status: parsed.status ?? 'ERROR', message: parsed.message ?? '' } })
              setStatus(parsed.status === 'OK' ? `выполнено: ${op}` : `действие не удалось: ${parsed.message ?? ''}`)
            } catch (error) {
              await report(base as string, { actResult: { op, status: 'ERROR', message: String(error) } })
            }
          }
        } else if (command.kind === 'capture') {
          const selector = String(command.args.selector ?? '')
          await report(base as string, { captureStage: { step: 'start', selector } })
          const view = activeGuest()
          await report(base as string, { captureStage: { step: 'guest', hasView: view !== null, hasCapture: view?.capturePage !== undefined } })
          if (view === null || view.capturePage === undefined) {
            setStatus('снимок недоступен: capturePage нет')
            await report(base as string, { captureError: 'capturePage отсутствует у гостя' })
          } else {
            try {
              let rect: { x: number; y: number; width: number; height: number } | undefined
              if (selector !== '' && view.executeJavaScript !== undefined) {
                const rawRect = await view.executeJavaScript(
                  `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return ''; const r = el.getBoundingClientRect(); return JSON.stringify({ x: Math.max(0, Math.round(r.left)), y: Math.max(0, Math.round(r.top)), width: Math.max(1, Math.round(r.width)), height: Math.max(1, Math.round(r.height)) }) })()`,
                  false,
                )
                if (typeof rawRect === 'string' && rawRect !== '') rect = JSON.parse(rawRect) as typeof rect
              }
              await report(base as string, { captureStage: { step: 'capturing', hasRect: rect !== undefined } })
              // Sub-rect captures can fail with `UnknownVizError`; the helper retries
              // and falls back to a full capture cropped on a canvas.
              const captured = await capturePageDataUrl(view, rect)
              await report(base as string, { captureStage: { step: 'captured', source: captured.source } })
              const dataUrl = captured.dataUrl
              if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
                setStatus('снимок: изображение пустое (панель скрыта?)')
                await report(base as string, { captureError: 'toDataURL вернул не изображение' })
              } else {
                const comma = dataUrl.indexOf(',')
                const base64 = comma > 0 ? dataUrl.slice(comma + 1) : ''
                const bytes = Math.floor((base64.length * 3) / 4)
                const size: { width: number; height: number } | undefined = undefined
                const semicolon = dataUrl.indexOf(';')
                const mime = semicolon > 5 ? dataUrl.slice(5, semicolon) : 'image/png'
                await report(base as string, {
                  crop: {
                    bytes,
                    width: rect?.width ?? size?.width ?? 0,
                    height: rect?.height ?? size?.height ?? 0,
                    mime,
                    base64,
                  },
                })
                setStatus(`снимок снят: ${bytes} байт`)
              }
            } catch (error) {
              const message = String(error)
              setStatus(`снимок не удался: ${message}`)
              await report(base as string, { captureError: message })
            }
          }
        } else if (command.kind === 'verify_area') {
          const view = activeGuest()
          const taskId = String(command.args.taskId ?? '')
          const covered = Array.isArray(command.args.covered)
            ? command.args.covered as Array<{ tag: string; id: string; classes: string }>
            : []
          setStatus(`агент: проверяю область (${covered.length} элементов)`)
          if (view === null || view.executeJavaScript === undefined) {
            await report(base as string, { coverage: { taskId, error: 'guest недоступен' } })
          } else {
            const reload = verifyNeedsReload(command.args)
            if (reload) view.reload?.()
            await new Promise((resolve) => setTimeout(resolve, verifySettleMs(reload)))
            try {
              const rawCoverage = await withTimeout(
                view.executeJavaScript(coverageScript(covered), false),
                5000,
                'E_TIMEOUT',
              )
              let parsedCoverage: { status?: string; found?: number; total?: number; message?: string } = {}
              try {
                parsedCoverage = typeof rawCoverage === 'string' ? JSON.parse(rawCoverage) as typeof parsedCoverage : {}
              } catch {
                parsedCoverage = { status: 'ERROR', message: String(rawCoverage) }
              }
              if (parsedCoverage.status === 'OK') {
                await report(base as string, {
                  coverage: { taskId, found: parsedCoverage.found ?? 0, total: parsedCoverage.total ?? 0 },
                })
                setStatus(`область: ${parsedCoverage.found ?? 0}/${parsedCoverage.total ?? 0} элементов`)
              } else {
                await report(base as string, { coverage: { taskId, error: parsedCoverage.message ?? 'проверка области не удалась' } })
              }
            } catch (error) {
              await report(base as string, { coverage: { taskId, error: String(error) } })
            }
          }
        } else if (command.kind === 'pick_area') {
          const view = activeGuest()
          setStatus('агент: выделите область мышью · Esc — отмена')
          if (view === null || view.executeJavaScript === undefined) {
            setStatus('выделение области недоступно: guest не готов')
          } else {
            try {
              await view.executeJavaScript(AREA_SCRIPT, true)
              const startedArea = Date.now()
              const areaTimer = window.setInterval(() => {
                const target = activeGuest()
                if (target === null || target.executeJavaScript === undefined) {
                  window.clearInterval(areaTimer)
                  return
                }
                if (Date.now() - startedArea > 120000) {
                  window.clearInterval(areaTimer)
                  setStatus('выделение области: время истекло')
                  return
                }
                void target.executeJavaScript(PICKER_POLL, false).then((value) => {
                  if (value === null || value === undefined) return
                  window.clearInterval(areaTimer)
                  const raw = typeof value === 'string' ? value : ''
                  if (raw === '') { setStatus('выделение области отменено'); return }
                  try {
                    const parsed = JSON.parse(raw) as { kind?: string; rect?: { width: number; height: number } }
                    if (parsed.kind !== 'area') { setStatus('область не выбрана'); return }
                    area = parsed
                    setStatus(`область ${parsed.rect?.width ?? 0}×${parsed.rect?.height ?? 0} сохранена`)
                  } catch {
                    setStatus('область вернула нечитаемые данные')
                  }
                }).catch(() => undefined)
              }, 250)
            } catch (error) {
              setStatus(`выделение области не установилось: ${String(error)}`)
            }
          }
        } else if (command.kind === 'viewport') {
          const zoom = Number(command.args.zoom ?? 1)
          const view = activeGuest()
          if (view !== null && view.setZoomFactor !== undefined && Number.isFinite(zoom)) {
            try {
              view.setZoomFactor(Math.min(2, Math.max(0.5, zoom)))
              setStatus(`масштаб ${zoom}`)
            } catch (error) {
              setStatus(`масштаб не применён: ${String(error)}`)
            }
          }
        } else if (command.kind === 'viewport_width') {
          // Approximate device-width emulation: Electron zoom changes the CSS
          // viewport, so targeting innerWidth works without CDP.
          const view = activeGuest()
          const target = Number(command.args.width ?? 0)
          if (view === null || view.executeJavaScript === undefined || view.setZoomFactor === undefined) {
            await report(base as string, { viewportResult: { width: target, innerWidth: 0, zoom: 1, error: 'guest не готов' } })
          } else {
            try {
              const readWidth = async (): Promise<number> => {
                const raw = await withTimeout(view.executeJavaScript('String(window.innerWidth)', false), 4000, 'E_TIMEOUT')
                const parsed = Number.parseInt(typeof raw === 'string' ? raw : '', 10)
                return Number.isFinite(parsed) ? parsed : 0
              }
              const currentZoom = typeof (view as { getZoomFactor?: () => number }).getZoomFactor === 'function'
                ? (view as { getZoomFactor: () => number }).getZoomFactor()
                : 1
              const from = await readWidth()
              if (from <= 0 || target <= 0) throw new Error('ширина недоступна')
              const nextZoom = Math.min(3, Math.max(0.25, currentZoom * (from / target)))
              view.setZoomFactor(nextZoom)
              await new Promise((resolve) => setTimeout(resolve, 300))
              const after = await readWidth()
              await report(base as string, { viewportResult: { width: target, innerWidth: after, zoom: nextZoom, error: '' } })
              setStatus(`ширина ${after}px (масштаб ${nextZoom.toFixed(2)})`)
            } catch (error) {
              await report(base as string, { viewportResult: { width: target, innerWidth: 0, zoom: 1, error: String(error) } })
              setStatus(`ширина не применена: ${String(error)}`)
            }
          }
        } else if (command.kind === 'verify') {
          const view = activeGuest()
          const taskId = String(command.args.taskId ?? '')
          const target = String(command.args.selector ?? '')
          const method = String(command.args.method ?? 'computed')
          const property = String(command.args.property ?? '')
          setStatus(`агент: проверяю ${property === '' ? method : property}`)
          if (view === null || view.executeJavaScript === undefined) {
            await report(base as string, { verify: { taskId, error: 'guest недоступен' } })
          } else {
            const reload = verifyNeedsReload(command.args)
            if (reload) view.reload?.()
            await new Promise((resolve) => setTimeout(resolve, verifySettleMs(reload)))
            try {
              const rawResult = await withTimeout(
                view.executeJavaScript(measureScript(target, method, property, String(command.args.tag ?? '')), false),
                5000,
                'E_TIMEOUT',
              )
              let parsed: { status?: string; value?: string; count?: number; tag?: string; expect?: string } = {}
              try {
                parsed = typeof rawResult === 'string' ? JSON.parse(rawResult) as typeof parsed : {}
              } catch {
                parsed = { status: 'ERROR', value: String(rawResult) }
              }
              if (parsed.status === 'OK' && typeof parsed.value === 'string') {
                await report(base as string, { verify: { taskId, value: parsed.value } })
                setStatus(`проверено: ${parsed.value.slice(0, 80)}`)
              } else if (parsed.status === 'MISSING') {
                await report(base as string, { verify: { taskId, error: 'E_STALE: элемент не найден' } })
              } else if (parsed.status === 'AMBIGUOUS') {
                await report(base as string, { verify: { taskId, error: `E_AMBIGUOUS: локатор нашёл ${parsed.count ?? 0} элементов` } })
              } else if (parsed.status === 'STALE') {
                await report(base as string, { verify: { taskId, error: `E_STALE: тег ${parsed.tag ?? '?'} вместо ${parsed.expect ?? '?'}` } })
              } else {
                await report(base as string, { verify: { taskId, error: parsed.value ?? 'замер не удался' } })
              }
            } catch (error) {
              await report(base as string, { verify: { taskId, error: String(error) } })
            }
          }
        }
      }
      await report(base as string, {
        stage: 'ready',
        url: activeGuest()?.getURL?.() ?? '',
        status: status,
        hasGuest: activeGuest() !== null,
        evidence: evidence,
        console: consoleRing.slice(-30),
        crop: crop,
        area: area,
        hidden: typeof document !== 'undefined' && document.visibilityState === 'hidden',
        counters: counters,
        sessions: listSessions(),
        activeTab: activeTabId,
        panels: mountedPanels,
      })
    }

  void tick()
  window.setInterval(() => void tick(), 2500)
  // If nothing ever activates a session, the channel is alive but there is no
  // page: say it out loud instead of waiting for a mystery.
  window.setTimeout(() => {
    if (sessions.size === 0) setStatus('сессия не активирована: панель не смонтировалась?')
  }, 6000)
  window.setInterval(collectIdleSessions, 60000)
}
