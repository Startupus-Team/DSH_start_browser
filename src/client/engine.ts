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
import { actScript, coverageScript, evidenceScript, inspectScript, measureScript, networkScript, pageScanScript, pageTextScript } from './verify-scripts'
import { cropRect as clampCropRect, normalizeAddress, pickSessionToEvict, verifyNeedsReload, verifySettleMs } from './rules'
import { focusStartapusTab, openStartapusTab } from './tabs'
import { setTabTitle } from './tab-titles'
import { lastHostRev, note, poll, probe, report, setTab } from './transport'

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
  host: HTMLElement | null
  ready: boolean
  /** Navigation requested before `dom-ready`; applied once the guest is ready. */
  pendingUrl: string
  /** Recovery bookkeeping: a crash loop must stop, not spin. */
  recoveryAttempts: number
  lastRecoveryAt: number
  /** The first navigation already happened; later dom-ready events must not repeat it. */
  navigated: boolean
}

export interface EngineState {
  stage: string
  control: 'agent' | 'human' | null
  agentActive: boolean
  status: string
  activeTab: string | null
  tabs: number
  url: string
  hasGuest: boolean
  counters: { acquires: number; releases: number; attachFailures: number; recoveries: number; panics: number; navigations: number; loadErrors: number; crashes: number }
  panels: number
}

// Injected by build.mjs; guarded so standalone tests of this module still load.
const CLIENT_REV = typeof __BUILD_REV__ === 'string' ? __BUILD_REV__ : 'dev'

const WORKSPACE_KEY = 'startapus-browser'
/** Guests are expensive: keep the pool small and drop idle pages. */
const MAX_SESSIONS = 6
const SESSION_IDLE_MS = 15 * 60 * 1000
const START_URL = 'https://startapus.com'

const sessions = new Map<string, Session>()
/** In-flight creations, so a re-render cannot acquire several leases. */
const pending = new Map<string, Promise<Session | null>>()
const consoleRing: Array<{ level: number; message: string }> = []
const counters = { acquires: 0, releases: 0, attachFailures: 0, recoveries: 0, panics: 0, navigations: 0, loadErrors: 0, crashes: 0 }
/** Last navigation failure as the guest reported it. */
let lastLoadError: { code: number; description: string; url: string; at: number } | null = null

let evidence: ElementPick | null = null
let crop: { bytes: number; width: number; height: number; base64?: string } | null = null
let area: unknown = null
let status = 'подготовка guest…'
let stage = 'ready'
let activeTabId: string | null = null
let loopStarted = false
/** Stops the live poll loop; the plugin's effect owns it, so HMR cannot leave a ghost. */
let stopEngine: () => void = () => undefined
let ticking = false
let misses = 0
let base: string | null = null
/** Who currently drives the page: the agent, or the human (via the pane button). */
let controlHolder: 'agent' | 'human' | null = null
/** While now < this, the agent has been acting recently — show the banner. */
let agentActiveUntil = 0
const AGENT_ACTIVE_MS = 10000
let closeRequested: () => boolean = () => false
let pickRequested: () => void = () => undefined
/** Opening a tab through the pane's own bound actions (falls back to the controller). */
let openTabRequested: ((url: string) => boolean) | null = null
/** Front a tab through the pane's bound actions. */
let focusTabRequested: ((tabId: string) => boolean) | null = null
/** DOM fallback: click our guide card (the kernel then opens the tab properly). */
let guideCardFallback: (() => boolean) | null = null
/** DOM fallback: click our tab in the kernel tab strip to activate its pane. */
let activateTabFallback: (() => boolean) | null = null
/** Last address-bar attempt, reported so a silent failure becomes visible. */
/** Test hook: wait for a ready guest the way commands do. */
export const awaitReadyForTest = readyView

/** What the shortcuts catalog actually accepted (reported for diagnosis). */
let shortcutState: { id: string; keys: string; ok: boolean; error: string } | null = null
let lastNavAttempt: { url: string; ok: boolean; reason: string; hasGuest: boolean; hasLoadURL: boolean; at: number } | null = null
const listeners = new Set<() => void>()
/** Panes currently mounted, by tab key (double mounts do not inflate the count). */
const mountedPaneKeys = new Set<string>()
/** Recent guest losses per tab; survives session replacement (a storm resets sessions). */
const recoveryLedger = new Map<string, number[]>()
/** Tabs whose guest creation waits for the pane to become visible. */
const deferredCreate = new Map<string, { url: string; host: HTMLElement | null }>()

/** Is the pane actually laid out (the kernel only attaches guests to visible panes)? */
function hostVisible(host: HTMLElement | null): boolean {
  if (host === null || !host.isConnected) return false
  if (typeof host.getBoundingClientRect !== 'function') return true
  // A visible panel can still live inside a collapsed (0x0) tab body: the kernel
  // only attaches guests to panes that are actually on screen, so walk the chain.
  let node: HTMLElement | null = host
  for (let depth = 0; node !== null && depth < 8; depth += 1) {
    if (typeof node.getBoundingClientRect !== 'function') return true
    const rect = node.getBoundingClientRect()
    if (rect === undefined) return true
    if (rect.width <= 1 || rect.height <= 1) return false
    if (typeof window.getComputedStyle === 'function') {
      const style = window.getComputedStyle(node)
      if (style.display === 'none' || style.visibility === 'hidden') return false
    }
    node = (node.parentElement ?? null) as HTMLElement | null
  }
  return true
}

/** Tabs with a rebuild in flight: two panels must not rebuild the same tab. */
const recovering = new Set<string>()

/** How many times a pane was mounted — a remount is what reloads a page. */
let panelMounts = 0

/** Read the browser bridge exposed by the DSH desktop preload. */
function browserBridge(): DesktopBridge | undefined {
  const desktop = (window as unknown as { dshDesktop?: { browser?: DesktopBridge } }).dshDesktop
  return desktop?.browser
}

/** Current engine snapshot for views. */
/** Register a mounted pane (called by the view on mount/unmount). */
export function notePanelMounted(tabKey: string): void {
  if (!mountedPaneKeys.has(tabKey)) panelMounts += 1
  mountedPaneKeys.add(tabKey)
  notify()
}

/** Unregister a mounted pane. */
export function notePanelUnmounted(tabKey: string): void {
  mountedPaneKeys.delete(tabKey)
  notify()
}

/** Panes currently mounted. */
export function panelsMounted(): number {
  return mountedPaneKeys.size
}

export function engineState(): EngineState {
  return {
    stage,
    control: controlHolder,
    agentActive: Date.now() < agentActiveUntil,
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
/** Remember the outcome of the shortcut registration. */
export function noteShortcutState(state: { id: string; keys: string; ok: boolean; error: string }): void {
  shortcutState = state
  notify()
}

/**
 * Shortcut text for the guide card description.
 * Empty when the kernel owns the hint (catalog row registered) — otherwise the
 * card still tells the user the working combination.
 */
export function shortcutHint(): string {
  return shortcutState?.ok === true ? '' : '⌘T'
}

export function setStatus(next: string): void {
  status = next
  notify()
}

/**
 * Navigate one session from the pane's address bar.
 * Never silent: the outcome (and why) is stored for `health.lastNavAttempt`.
 */
export function openInSession(tabId: string, rawUrl: string): { ok: boolean; reason: string; url: string } {
  const normalized = normalizeAddress(rawUrl)
  if (!normalized.ok) {
    lastNavAttempt = { url: rawUrl, ok: false, reason: normalized.reason, hasGuest: false, hasLoadURL: false, at: Date.now() }
    notify()
    return { ok: false, reason: normalized.reason, url: rawUrl }
  }
  const session = sessions.get(tabId)
  // Address bar is tab-scoped: falling back to another tab's guest navigated the
  // wrong page and then claimed "гость этой вкладки не создан" for this one.
  const guest = session?.guest ?? null
  if (session !== undefined && !session.ready) {
    // Calling loadURL before `dom-ready` throws inside Electron; remember it instead.
    session.pendingUrl = normalized.url
    lastNavAttempt = { url: normalized.url, ok: true, reason: 'отложено до dom-ready', hasGuest: true, hasLoadURL: true, at: Date.now() }
    setStatus(`открою ${normalized.url} после готовности гостя`)
    notify()
    return { ok: true, reason: '', url: normalized.url }
  }
  const hasLoadURL = typeof guest?.loadURL === 'function'
  if (guest === null || guest === undefined || !hasLoadURL) {
    // The guest is not there yet: record the target and let reconciliation build it.
    requestedUrl.set(tabId, normalized.url)
    const state = paneState.get(tabId)
    if (state !== undefined) paneState.set(tabId, { ...state, url: normalized.url })
    lastNavAttempt = { url: normalized.url, ok: true, reason: 'гость будет создан и откроет адрес', hasGuest: false, hasLoadURL: false, at: Date.now() }
    notify()
    setStatus(`создам гостя вкладки и открою ${normalized.url}`)
    scheduleReconcile()
    return { ok: true, reason: '', url: normalized.url }
  }
  if (false) {
    const reason = ''
    lastNavAttempt = { url: normalized.url, ok: false, reason, hasGuest: true, hasLoadURL, at: Date.now() }
    notify()
    setStatus(`навигация не удалась: ${reason}`)
    return { ok: false, reason, url: normalized.url }
  }
  try {
    counters.navigations += 1
    guest.loadURL(normalized.url)
    lastNavAttempt = { url: normalized.url, ok: true, reason: '', hasGuest: true, hasLoadURL: true, at: Date.now() }
    setStatus(`открываю ${normalized.url}`)
    notify()
    return { ok: true, reason: '', url: normalized.url }
  } catch (error) {
    const reason = String(error instanceof Error ? error.message : error)
    lastNavAttempt = { url: normalized.url, ok: false, reason, hasGuest: true, hasLoadURL: true, at: Date.now() }
    setStatus(`навигация не удалась: ${reason}`)
    notify()
    return { ok: false, reason, url: normalized.url }
  }
}

/** Open one more Startapus tab: bound actions first, controller as fallback. */
export function requestOpenTab(url = ''): { ok: boolean; via: 'pane' | 'controller' | 'guide'; error: string } {
  if (openTabRequested !== null && openTabRequested(url)) return { ok: true, via: 'pane', error: '' }
  const fallback = openStartapusTab('startapus-browser', url === '' ? {} : { url })
  if (!fallback.opened) return { ok: false, via: 'controller', error: fallback.error }
  // The controller can create a tab nobody activates when no pane exists yet;
  // clicking our guide card goes through the kernel's own gesture path.
  if (mountedPaneKeys.size === 0 && guideCardFallback !== null && guideCardFallback()) {
    return { ok: true, via: 'guide', error: '' }
  }
  return { ok: true, via: 'controller', error: '' }
}

/** Install the DOM fallback used when no pane exists yet. */
export function setGuideFallback(run: () => boolean): void {
  guideCardFallback = run
}

/** Install the DOM fallback that activates an already mounted Startapus tab. */
export function setActivateFallback(run: () => boolean): void {
  activateTabFallback = run
}

/** What each pane wants, as reported by the panel: url, host and visibility. */
interface PaneState {
  url: string
  host: HTMLElement | null
  visible: boolean
}
const paneState = new Map<string, PaneState>()
/** Tabs whose renderer died: held until the human asks to restore them. */
const crashedTabs = new Map<string, { url: string; reason: string; at: number }>()

/** Address typed before the guest existed: it wins over the pane's default URL. */
const requestedUrl = new Map<string, string>()
let reconciling = false
let reconcileTimer: number | null = null

/** The panel tells the engine what its pane currently is. */
export function setPaneState(tabId: string, state: Partial<PaneState>): void {
  const previous = paneState.get(tabId) ?? { url: START_URL, host: null, visible: false }
  paneState.set(tabId, {
    url: state.url ?? previous.url,
    host: state.host ?? previous.host,
    visible: state.visible ?? previous.visible,
  })
  scheduleReconcile()
}

function scheduleReconcile(): void {
  window.setTimeout(() => {
    void reconcile()
  }, 0)
}

/**
 * Reconcile desired pane state with reality: a visible pane must have a live
 * guest, a hidden one must not acquire new guests. This replaces the old
 * one-shot "create at mount" decision that left visible panes guestless.
 */
async function reconcile(): Promise<void> {
  if (reconciling) return
  reconciling = true
  try {
    for (const [tabId, state] of [...paneState.entries()]) {
      const crashed = crashedTabs.get(tabId)
      if (crashed !== undefined) {
        // Hold the crashed tab: automatic resurrection was the flicker loop.
        continue
      }
      const session = sessions.get(tabId)
      if (!state.visible) {
        if (session !== undefined) position(session, false)
        continue
      }
      if (session !== undefined && session.guest !== null && session.container.isConnected) {
        position(session, true)
        continue
      }
      const url = state.url === '' ? START_URL : state.url
      await showSession(tabId, url, state.host)
    }
  } finally {
    reconciling = false
  }
}

/** Human asked to restore a crashed tab: forget the crash and rebuild it. */
export function restoreCrashedTab(tabId: string): boolean {
  const crashed = crashedTabs.get(tabId)
  if (crashed === undefined) return false
  crashedTabs.delete(tabId)
  const state = paneState.get(tabId)
  paneState.set(tabId, { url: crashed.url, host: state?.host ?? null, visible: true })
  setStatus('восстанавливаю страницу после падения')
  scheduleReconcile()
  return true
}

/** Crash info for one tab (used by the panel's restore chip). */
export function crashedInfo(tabId: string): { url: string; reason: string; at: number } | null {
  return crashedTabs.get(tabId) ?? null
}

/** Start element picking from the panel/shortcut, not only from the agent command. */
export function requestPick(): boolean {
  try {
    pickRequested()
    return true
  } catch {
    return false
  }
}

/** Try to front one of our tabs after a deferred creation. */
export function activateOwnTab(): boolean {
  if (activateTabFallback === null) return false
  try {
    return activateTabFallback()
  } catch {
    return false
  }
}

/** The human takes the page back: agent mutations are refused from now on. */
export function takeHumanControl(): void {
  controlHolder = 'human'
  agentActiveUntil = 0
  setStatus('управление у вас: действия агента на странице приостановлены')
  notify()
}

/** The human hands the page back to the agent. */
export function releaseToAgent(): void {
  controlHolder = 'agent'
  agentActiveUntil = Date.now() + AGENT_ACTIVE_MS
  setStatus('управление у агента')
  notify()
}

/** Called when the agent performs a mutating action. */
export function noteAgentAction(): void {
  if (controlHolder === 'human') return
  controlHolder = 'agent'
  agentActiveUntil = Date.now() + AGENT_ACTIVE_MS
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

/**
 * Guest addressed by a command, waiting for `dom-ready` when needed.
 * Electron throws "The WebView must be attached to the DOM and the dom-ready
 * event emitted before this method can be called" for any call before that.
 */
async function readyView(command: { args: Record<string, unknown> }, timeoutMs = 3000): Promise<GuestElement | null> {
  const tabId = String(command.args.tabId ?? '')
  const preferred = tabId !== '' ? sessions.get(tabId) : sessions.get(activeTabId ?? '')
  const deadline = Date.now() + timeoutMs
  let candidate = preferred
  for (;;) {
    if (candidate !== undefined && candidate.guest !== null && candidate.ready) return candidate.guest
    if (Date.now() >= deadline) break
    await new Promise((resolve) => setTimeout(resolve, 100))
    if (candidate === undefined || candidate.guest === null) {
      candidate = sessions.get(activeTabId ?? '') ?? candidate
    }
  }
  // Never substitute another tab: addressing is the whole point of the wait.
  return null
}

/** Guest addressed by a command: `args.tabId` when present, else the active one. */
function guestFor(command: { args: Record<string, unknown> }): GuestElement | null {
  const tabId = String(command.args.tabId ?? '')
  if (tabId === '') return activeGuest()
  const session = sessions.get(tabId)
  return session?.guest ?? null
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
export function setViewHooks(hooks: {
  closeRequested?: () => boolean
  pickRequested?: () => void
  openTabRequested?: (url: string) => boolean
  focusTabRequested?: (tabId: string) => boolean
}): void {
  if (hooks.closeRequested !== undefined) closeRequested = hooks.closeRequested
  if (hooks.pickRequested !== undefined) pickRequested = hooks.pickRequested
  if (hooks.openTabRequested !== undefined) openTabRequested = hooks.openTabRequested
  if (hooks.focusTabRequested !== undefined) focusTabRequested = hooks.focusTabRequested
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
  // Only visibility: a synthetic `resize` nudge made pages repaint/reflow on every
  // activation, which reads as the page "reopening".
  session.container.style.display = visible ? 'flex' : 'none'
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
    host,
    ready: false,
    pendingUrl: '',
    recoveryAttempts: 0,
    lastRecoveryAt: 0,
    navigated: false,
  }
  sessions.set(tabId, session)
  notify()

  try {
    counters.acquires += 1
    setStatus('запрос резервации guest…')
    const reservation = await bridge.acquire(WORKSPACE_KEY)
    void note('lease:acquire', { tabId, lease: reservation.lease.slice(0, 12) })
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
      session.recoveryAttempts = 0
      const remembered = session.url.startsWith('about:blank') ? '' : session.url
      const target = session.pendingUrl !== '' ? session.pendingUrl : (remembered === '' ? initialUrl : remembered)
      session.pendingUrl = ''
      counters.navigations += 1
      created.loadURL?.(target)
      setStatus(`guest подключён: ${target}`)
      notify()
    })
    created.addEventListener('did-navigate', () => onNavigate(session, created))
    created.addEventListener('did-navigate-in-page', () => onNavigate(session, created))
    created.addEventListener('page-title-updated', () => onTitle(session, created))
    created.addEventListener('console-message', (event: Event) => {
      // Electron versions differ: the payload may live on `detail` or directly
      // on the event. Reading only one of them produced empty messages.
      const detail = (event as CustomEvent<{ level?: number; message?: string; text?: string }>).detail
      const loose = event as unknown as { level?: number; message?: string; text?: string }
      const level = typeof loose.level === 'number' ? loose.level : (typeof detail?.level === 'number' ? detail.level : 0)
      const message = String(loose.message ?? loose.text ?? detail?.message ?? detail?.text ?? '')
      consoleRing.push({ level, message: message.slice(0, 300) })
      while (consoleRing.length > 200) consoleRing.shift()
    })
    const onLost = (kind: string) => (event: Event): void => {
      // Electron versions put `reason` either on `detail` or on the event itself.
      const detail = (event as CustomEvent<{ reason?: string; details?: string }>).detail
      const loose = event as unknown as { reason?: unknown; details?: unknown }
      const raw = loose.reason ?? loose.details ?? detail?.reason ?? detail?.details
      const reason = raw === undefined || raw === null
        ? ''
        : (typeof raw === 'string' ? raw : String((raw as { reason?: string }).reason ?? JSON.stringify(raw)))
      handleGuestLoss(session, reason === '' ? kind : `${kind}:${reason}`)
    }
    created.addEventListener('render-process-gone', onLost('render-process-gone'))
    created.addEventListener('crashed', onLost('crashed'))
    created.addEventListener('destroyed', onLost('destroyed'))

    created.addEventListener('did-fail-load', (event: Event) => {
      const detail = (event as CustomEvent<{ errorCode?: number; errorDescription?: string; validatedURL?: string; isMainFrame?: boolean }>).detail
      const code = Number(detail?.errorCode ?? 0)
      // -3: aborted by a newer navigation; 0: no error code at all (subframe or
      // cancelled load). Neither is a failure of the page the user sees.
      if (code === -3 || code === 0) return
      if (detail?.isMainFrame === false) return
      counters.loadErrors += 1
      lastLoadError = {
        code,
        description: String(detail?.errorDescription ?? ''),
        url: String(detail?.validatedURL ?? created.getURL?.() ?? ''),
        at: Date.now(),
      }
      setStatus(`ошибка загрузки ${code} ${lastLoadError.description} · ${lastLoadError.url}`)
      notify()
    })

    container.appendChild(created)
    session.guest = created
    notify()

    window.setTimeout(() => {
      if (session.ready || session.guest === null) return
      counters.attachFailures += 1
      // Keep a compact DOM trace in the status: it is readable without restarting
      // the host plugin, which is where the note log lives.
      const trace: string[] = []
      let cursor: HTMLElement | null = host
      while (cursor !== null && trace.length < 5) {
        const box = cursor.getBoundingClientRect()
        const id = cursor.id === '' ? '' : `#${cursor.id}`
        trace.push(`${cursor.tagName.toLowerCase()}${id}(${Math.round(box.width)}x${Math.round(box.height)})`)
        cursor = cursor.parentElement
      }
      setStatus(`guest не подключился: ядро отклонило attach · ${trace.join(' < ') || 'нет host'}`)
      const chain: Array<Record<string, unknown>> = []
      let node: HTMLElement | null = host
      while (node !== null && chain.length < 8) {
        chain.push({
          tag: node.tagName.toLowerCase(),
          id: node.id,
          cls: String(node.className).slice(0, 80),
          dataset: JSON.stringify(node.dataset).slice(0, 200),
          rect: (() => { const r = node.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}` })(),
        })
        node = node.parentElement
      }
      void note('attach:timeout', {
        tabId,
        lease: session.lease === null ? '' : session.lease.slice(0, 12),
        connected: created.isConnected,
        url: created.getURL?.() ?? '',
        chain,
      })
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

/**
 * The guest process died (crash, OOM, killed): the lease is dead too. Forget the
 * guest and rebuild the session in place — otherwise the pane turns into a zombie
 * with `hasGuest: true` and no pixels.
 */
function handleGuestLoss(session: Session, kind: string): void {
  if (session.guest === null) return
  // A closed session is disposed on purpose: no recovery, no counter.
  if (sessions.get(session.tabId) !== session) return
  if (kind.startsWith('render-process-gone') || kind.startsWith('crashed')) {
    // The kernel closes a tab whose renderer died (`render-process-gone` handler in
    // the built-in browser does the same). Rebuilding on a dead lease is what made
    // the panel flicker in a loop; here we dispose and say so.
    counters.crashes += 1
    sessions.delete(session.tabId)
    releaseLease(session)
    try {
      session.container.remove()
    } catch {
      // already gone
    }
    crashedTabs.set(session.tabId, { url: session.url, reason: kind, at: Date.now() })
    setStatus(`рендерер упал (${kind}) — страница остановлена, нажмите «Восстановить» в панели`)
    void note('guest:crashed', { tabId: session.tabId, kind, url: session.url.slice(0, 120) })
    notify()
    return
  }
  const now = Date.now()
  if (now - session.lastRecoveryAt < 3000) return
  session.lastRecoveryAt = now
  const recent = (recoveryLedger.get(session.tabId) ?? []).filter((at) => now - at < 10000)
  if (recent.length >= 3) {
    recoveryLedger.set(session.tabId, recent)
    setStatus(`E_GUEST_LOOP: гость падает (${kind}) больше 3 раз за 10 с — остановил восстановление`)
    sessions.delete(session.tabId)
    releaseLease(session)
    try {
      session.container.remove()
    } catch {
      // already gone
    }
    notify()
    return
  }
  recent.push(now)
  recoveryLedger.set(session.tabId, recent)
  if (session.recoveryAttempts >= 3) {
    setStatus(`E_GUEST_LOOP: гость падает (${kind}) больше 3 раз — остановил восстановление, переоткройте вкладку`)
    session.guest = null
    session.ready = false
    notify()
    return
  }
  session.recoveryAttempts += 1
  counters.recoveries += 1
  session.guest = null
  session.ready = false
  session.navigated = false
  setStatus(`гость потерян (${kind}) — восстанавливаю страницу`)
  notify()
  const host = session.host
  const url = session.url.startsWith('about:blank') ? START_URL : session.url
  void note('guest:lost', {
    tabId: session.tabId,
    kind,
    attempt: session.recoveryAttempts,
    url: session.url.slice(0, 120),
    lease: session.lease === null ? '' : session.lease.slice(0, 12),
  })
  window.setTimeout(() => {
    if (sessions.get(session.tabId) !== session) return
    if (recovering.has(session.tabId)) return
    recovering.add(session.tabId)
    sessions.delete(session.tabId)
    releaseLease(session)
    try {
      session.container.remove()
    } catch {
      // already gone
    }
    void showSession(session.tabId, url, host)
      .catch(() => undefined)
      .finally(() => recovering.delete(session.tabId))
  }, 0)
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
  // A second activation may arrive while the first is still acquiring the guest
  // (mount + visibility effects). Deleting "guest === null" there orphaned the
  // in-flight session: acquires grew once, but the registry stayed empty.
  const inFlight = pending.get(tabId)
  if (inFlight !== undefined) {
    const raced = await inFlight
    for (const other of sessions.values()) {
      if (other.tabId !== tabId) position(other, false)
    }
    if (raced !== null) position(raced, true)
    notify()
    return
  }
  // The kernel attaches a guest only while its pane is laid out. Creating one for a
  // hidden tab produced `attachFailures` and no `dom-ready`, so wait for the layout
  // and defer the rest until the tab is shown.
  if (host !== null) {
    let visible = hostVisible(host)
    for (let waited = 0; !visible && waited < 600; waited += 100) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      visible = hostVisible(host)
    }
    if (!visible) {
      setStatus('вкладка скрыта: страница создастся, когда её покажут')
      notify()
      return
    }
  }
  deferredCreate.delete(tabId)

  const known = sessions.get(tabId)
  if (known !== undefined && !known.container.isConnected) {
    // The pane DOM was replaced (plugin reload, remount): the guest inside the
    // detached container is dead, so forget the zombie session and build a new one.
    releaseLease(known)
    sessions.delete(tabId)
  }
  const targetUrl = requestedUrl.get(tabId) ?? (initialUrl === '' ? START_URL : initialUrl)
  const session = sessions.get(tabId) ?? (await ensureSession(tabId, targetUrl, host))
  requestedUrl.delete(tabId)
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
  releaseLease(session)
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
    // Ghost sessions are handled on activation (`showSession`); a detached
    // container here may simply mean React is re-mounting the pane, so the sweep
    // only drops pages that nobody looked at for a long time.
    if (session.tabId === activeTabId) continue
    if (now - session.lastActiveAt < SESSION_IDLE_MS) continue
    closeSession(session.tabId)
  }
}

/** Release a session's lease exactly once (a leaked lease kills the next guest). */
function releaseLease(session: Session): void {
  if (session.lease === null) return
  const lease = session.lease
  session.lease = null
  counters.releases += 1
  void note('lease:release', { tabId: session.tabId, lease: lease.slice(0, 12), reason: session.ready ? 'close' : 'lost' })
  const bridge = browserBridge()
  if (bridge !== undefined) void bridge.release(lease).catch(() => undefined)
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

/** Start the single agent channel (idempotent); returns the disposer its fiber owns. */
export function startEngine(): () => void {
  if (loopStarted) return stopEngine
  loopStarted = true
    const tick = async (): Promise<void> => {
      try {
        await tickOnce()
      } catch (error) {
        // One bad report must never kill the poll loop: that leaves the tab
        // connected but deaf to agent commands.
        setStatus(`цикл: ${String(error)}`)
      } finally {
        ticking = false
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
      if (lastHostRev !== '' && lastHostRev !== CLIENT_REV) {
        setStatus(`клиент устарел: rev ${CLIENT_REV}, host ${lastHostRev} — перезапустите DSH`)
      }
      if (command !== null) {
        await report(base as string, { lastCommand: { id: command.id, kind: command.kind, at: Date.now() } })
        if (command.kind === 'open' && typeof command.args.url === 'string') {
          const targetUrl = String(command.args.url)
          const keySession = sessions.get(activeTabId ?? '')
          const view = activeGuest()
          if (keySession !== undefined && !keySession.ready) {
            // `loadURL` before `dom-ready` throws inside Electron: remember it.
            keySession.pendingUrl = targetUrl
            setStatus(`агент: открою ${targetUrl} после готовности гостя`)
          } else if (view === null || typeof view.loadURL !== 'function') {
            setStatus('агент: E_GUEST_GONE — гость вкладки не создан')
          } else {
            counters.navigations += 1
            view.loadURL(targetUrl)
            setStatus(`агент: открываю ${targetUrl}`)
          }
        } else if (command.kind === 'reload') {
          const view = activeGuest()
          if (view !== null && typeof view.reload === 'function') view.reload()
          setStatus('агент: перезагрузка')
        } else if (command.kind === 'pick') {
          setStatus('агент: выбор элемента')
          pickRequested()
        } else if (command.kind === 'read_page') {
          const view = await readyView(command)
          const limit = Math.min(200, Math.max(10, Number(command.args.limit ?? 120)))
          if (view === null || view.executeJavaScript === undefined) {
            await report(base as string, { pageScan: { error: 'E_GUEST_GONE: гость вкладки не создан (пересоздайте вкладку)' } })
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
        } else if (command.kind === 'act_batch' && controlHolder === 'human') {
          await report(base as string, { actResults: [{ op: '-', status: 'ERROR', message: 'E_HUMAN_CONTROL: управление у человека' }] })
          setStatus('агент: пакет действий отклонён — управление у вас')
        } else if (command.kind === 'act_batch') {
          noteAgentAction()
          const view = await readyView(command)
          const items = Array.isArray(command.args.items)
            ? command.args.items as Array<{ op: string; selector: string; value: string }>
            : []
          const results: Array<{ op: string; status: string; message: string }> = []
          if (view === null || view.executeJavaScript === undefined) {
            results.push({ op: '-', status: 'ERROR', message: 'E_GUEST_GONE: гость вкладки не создан (пересоздайте вкладку)' })
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
        } else if (command.kind === 'page_text') {
          const view = await readyView(command)
          const limit = Math.min(20000, Math.max(1000, Number(command.args.limit ?? 5000)))
          if (view === null || view.executeJavaScript === undefined) {
            await report(base as string, { pageText: { error: 'E_GUEST_GONE: гость вкладки не создан (пересоздайте вкладку)' } })
          } else {
            try {
              const raw = await withTimeout(view.executeJavaScript(pageTextScript(limit), false), 6000, 'E_TIMEOUT')
              const parsed = typeof raw === 'string' ? JSON.parse(raw) as Record<string, unknown> : {}
              await report(base as string, { pageText: { ...parsed, at: Date.now() } })
            } catch (error) {
              await report(base as string, { pageText: { error: String(error), at: Date.now() } })
            }
          }
        } else if (command.kind === 'network') {
          const view = await readyView(command)
          const limit = Math.min(200, Math.max(10, Number(command.args.limit ?? 100)))
          if (view === null || view.executeJavaScript === undefined) {
            await report(base as string, { network: { error: 'E_GUEST_GONE: гость вкладки не создан (пересоздайте вкладку)' } })
          } else {
            try {
              const raw = await withTimeout(view.executeJavaScript(networkScript(limit), false), 6000, 'E_TIMEOUT')
              const parsed = typeof raw === 'string' ? JSON.parse(raw) as Record<string, unknown> : {}
              await report(base as string, { network: { ...parsed, at: Date.now() } })
            } catch (error) {
              await report(base as string, { network: { error: String(error), at: Date.now() } })
            }
          }
        } else if (command.kind === 'inspect') {
          const view = await readyView(command)
          const selector = String(command.args.selector ?? '')
          const styles = Array.isArray(command.args.styles) ? command.args.styles.map(String).slice(0, 40) : []
          if (view === null || view.executeJavaScript === undefined) {
            await report(base as string, { inspect: { error: 'E_GUEST_GONE: гость вкладки не создан (пересоздайте вкладку)' } })
          } else {
            try {
              const raw = await withTimeout(view.executeJavaScript(inspectScript(selector, styles), false), 6000, 'E_TIMEOUT')
              const parsed = typeof raw === 'string' ? JSON.parse(raw) as Record<string, unknown> : {}
              await report(base as string, { inspect: { ...parsed, at: Date.now() } })
            } catch (error) {
              await report(base as string, { inspect: { error: String(error), at: Date.now() } })
            }
          }
        } else if (command.kind === 'guest_state') {
          const view = await readyView(command)
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
        } else if (command.kind === 'activate_self') {
          const activated = activateOwnTab()
          setStatus(activated ? 'активирую вкладку кликом по ярлыку' : 'не нашёл ярлык вкладки в полосе')
          await report(base as string, { activateResult: { activated, at: Date.now() } })
        } else if (command.kind === 'focus_tab') {
          const target = String(command.args.tabId ?? '')
          // Bound pane actions first; the navigation controller's focus(tabId)
          // is the documented fallback.
          const focused = (focusTabRequested !== null && focusTabRequested(target)) || focusStartapusTab(target)
          await report(base as string, { focusTabResult: { tabId: target, focused } })
          setStatus(focused ? `вкладка ${target} активирована` : `не удалось активировать ${target}`)
        } else if (command.kind === 'close_tab') {
          const target = activeTabId
          const closed = target === null ? false : closeSession(target) === true
          await report(base as string, { closeTabResult: { closed } })
          if (!closed) setStatus('закрыть вкладку не удалось: нет доступа к actions.closeTab')
        } else if (command.kind === 'new_tab') {
          const target = String(command.args.url ?? '')
          // Prefer the pane's bound actions: a controller-level open can create a
          // tab that the kernel never activates (no session binding).
          const viaPane = openTabRequested === null ? false : openTabRequested(target)
          const result = viaPane
            ? { opened: true, error: '' }
            : openStartapusTab('startapus-browser', target === '' ? {} : { url: target })
          await report(base as string, { newTabResult: { opened: result.opened, url: target, error: result.error } })
          setStatus(result.opened
            ? (viaPane
              ? `открыта новая вкладка${target === '' ? '' : `: ${target}`}`
              : `вкладка открыта общим контроллером${target === '' ? '' : ` (${target})`}: если панель не появилась — выберите вкладку в полосе`)
            : `новая вкладка не открылась: ${result.error}`)
        } else if (command.kind === 'console_clear') {
          consoleRing.length = 0
          setStatus('консоль очищена')
        } else if (command.kind === 'select') {
          const view = await readyView(command)
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
        } else if (command.kind === 'act' && controlHolder === 'human') {
          await report(base as string, { actResult: { op: String(command.args.op ?? ''), status: 'ERROR', message: 'E_HUMAN_CONTROL: управление у человека' } })
          setStatus('агент: действие отклонено — управление у вас')
        } else if (command.kind === 'act') {
          noteAgentAction()
          const view = await readyView(command)
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
          const view = await readyView(command)
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
          const view = await readyView(command)
          const taskId = String(command.args.taskId ?? '')
          const covered = Array.isArray(command.args.covered)
            ? command.args.covered as Array<{ tag: string; id: string; classes: string }>
            : []
          setStatus(`агент: проверяю область (${covered.length} элементов)`)
          if (view === null || view.executeJavaScript === undefined) {
            await report(base as string, { coverage: { taskId, error: 'E_GUEST_GONE: гость вкладки недоступен' } })
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
          const view = await readyView(command)
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
          const view = await readyView(command)
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
          const view = await readyView(command)
          const target = Number(command.args.width ?? 0)
          if (view === null || view.executeJavaScript === undefined || view.setZoomFactor === undefined) {
            await report(base as string, { viewportResult: { width: target, innerWidth: 0, zoom: 1, error: 'E_GUEST_GONE: гость вкладки не создан (пересоздайте вкладку)' } })
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
          const view = await readyView(command)
          const taskId = String(command.args.taskId ?? '')
          const target = String(command.args.selector ?? '')
          const method = String(command.args.method ?? 'computed')
          const property = String(command.args.property ?? '')
          setStatus(`агент: проверяю ${property === '' ? method : property}`)
          if (view === null || view.executeJavaScript === undefined) {
            await report(base as string, { verify: { taskId, commandId: command.id, error: 'E_GUEST_GONE: гость вкладки недоступен' } })
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
                await report(base as string, { verify: { taskId, commandId: command.id, value: parsed.value } })
                setStatus(`проверено: ${parsed.value.slice(0, 80)}`)
              } else if (parsed.status === 'MISSING') {
                await report(base as string, { verify: { taskId, commandId: command.id, error: 'E_STALE: элемент не найден' } })
              } else if (parsed.status === 'AMBIGUOUS') {
                await report(base as string, { verify: { taskId, commandId: command.id, error: `E_AMBIGUOUS: локатор нашёл ${parsed.count ?? 0} элементов` } })
              } else if (parsed.status === 'STALE') {
                await report(base as string, { verify: { taskId, error: `E_STALE: тег ${parsed.tag ?? '?'} вместо ${parsed.expect ?? '?'}` } })
              } else {
                await report(base as string, { verify: { taskId, error: parsed.value ?? 'замер не удался' } })
              }
            } catch (error) {
              await report(base as string, { verify: { taskId, commandId: command.id, error: String(error) } })
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
        console: consoleRing.slice(-200),
        crop: crop,
        area: area,
        hidden: typeof document !== 'undefined' && document.visibilityState === 'hidden',
        counters: counters,
        sessions: listSessions(),
        activeTab: activeTabId,
        panels: mountedPaneKeys.size,
        panes: [...mountedPaneKeys],
        lastNavAttempt,
        shortcutState,
        clientRev: CLIENT_REV,
        panelMounts,
        lastLoadError,
        control: controlHolder,
        agentActive: Date.now() < agentActiveUntil,
      })
    }

  void tick()
  const pollTimer = window.setInterval(() => void tick(), 2500)
  // If nothing ever activates a session, the channel is alive but there is no
  // page: say it out loud instead of waiting for a mystery.
  const hintTimer = window.setTimeout(() => {
    if (sessions.size === 0) {
      setStatus('нет открытой вкладки: нажмите ⌘T (Ctrl+T) — первую вкладку открывает человек, дальше агент управляет сам')
    }
  }, 6000)
  const idleTimer = window.setInterval(collectIdleSessions, 60000)
  // The effect that started the loop owns its teardown. Without this, every
  // client rebuild leaves the previous interval polling the same host, and two
  // revisions of the plugin fight over agent commands.
  stopEngine = () => {
    if (!loopStarted) return
    loopStarted = false
    window.clearInterval(pollTimer)
    window.clearTimeout(hintTimer)
    window.clearInterval(idleTimer)
    stopEngine = () => undefined
  }
  return stopEngine
}
