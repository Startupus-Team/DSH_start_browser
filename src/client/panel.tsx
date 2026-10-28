/**
 * Startapus Browser — the panel view.
 *
 * Thin by design: the guest, its lease and the agent channel live in
 * `engine.ts`, so unmounting or switching a tab cannot destroy a page or
 * silence the channel. This component only renders chrome and reports the
 * rectangle where the page should be shown.
 *
 * @module startapus-browser/client/panel
 */

import { Component, useCallback, useEffect, useRef, useState } from 'react'
import {
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiCrosshair,
  FiExternalLink,
  FiRotateCw,
} from 'react-icons/fi'

import type { ElementPick } from './element-refs.ts'
import {
  activeGuest,
  detachSession,
  engineState,
  guestOf,
  openInSession,
  releaseToAgent,
  takeHumanControl,
  notePanelMounted,
  notePanelUnmounted,
  runInActive,
  setEvidence,
  setPaneState,
  desiredUrlFor,
  restoreCrashedTab,
  crashedInfo,
  setSessionRect,
  setStatus,
  setViewHooks,
  subscribeEngine,
} from './engine'
import { normalizeAddress } from './rules'
import { activateOwnTab, setTabCloser } from './engine'
import { focusStartapusTab } from './tabs'
import { PICKER_POLL, PICKER_SCRIPT } from './picker-source'


const STYLES = `
.dsh-startapus-browser { position:relative; display:flex; flex-direction:column; height:100%; min-height:0; font-size:12px; }
.dsh-startapus-browser-toolbar { display:flex; align-items:center; gap:4px; padding:6px 8px; border-bottom:1px solid color-mix(in srgb, currentColor 12%, transparent); }
.dsh-startapus-browser-btn { display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border:none; border-radius:6px; background:transparent; color:inherit; cursor:pointer; }
.dsh-startapus-browser-btn svg { width:16px; height:16px; display:block; }
.dsh-startapus-browser-btn:hover { background:color-mix(in srgb, currentColor 10%, transparent); }
.dsh-startapus-browser-address { flex:1; min-width:0; height:26px; padding:0 8px; border:1px solid color-mix(in srgb, currentColor 18%, transparent); border-radius:6px; background:transparent; color:inherit; font:inherit; outline:none; }
.dsh-startapus-browser-status { padding:4px 10px 8px; opacity:0.72; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-startapus-browser-host { flex:1; min-height:0; }
.dsh-startapus-browser-tasksBtn { width:auto; padding:0 8px; font-size:11px; }
.dsh-startapus-browser-tasks { position:absolute; top:34px; left:8px; right:8px; max-height:60%; overflow:auto; z-index:7; display:flex; flex-direction:column; gap:6px; padding:8px; border-radius:8px; background:color-mix(in srgb, #111 92%, white 8%); box-shadow:0 6px 24px rgba(0,0,0,0.4); font-size:11px; }
.dsh-startapus-browser-tasksHead { display:flex; align-items:center; justify-content:space-between; }
.dsh-startapus-browser-tasks ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:4px; }
.dsh-startapus-browser-tasks li { display:grid; grid-template-columns:auto 1fr; gap:2px 6px; padding:4px 6px; border-radius:6px; background:color-mix(in srgb, currentColor 6%, transparent); }
.dsh-startapus-browser-taskState { grid-row:span 2; align-self:center; font-size:10px; padding:1px 6px; border-radius:10px; background:color-mix(in srgb, currentColor 12%, transparent); }
.dsh-startapus-browser-taskText { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-startapus-browser-taskMeta { opacity:0.6; }
.dsh-startapus-browser-tasksEmpty, .dsh-startapus-browser-tasksErr { opacity:0.7; }
.dsh-startapus-browser-crash { position:absolute; top:34px; left:8px; right:8px; z-index:6; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 8px; border-radius:6px; font-size:11px; background:color-mix(in srgb, #d9534f 28%, #111 72%); box-shadow:0 2px 10px rgba(0,0,0,0.3); }
.dsh-startapus-browser-crash button { font-size:11px; padding:2px 8px; cursor:pointer; }
.dsh-startapus-browser-control { position:absolute; top:34px; left:8px; right:8px; z-index:5; display:flex; align-items:center; gap:8px; padding:5px 8px; border-radius:6px; font-size:11px; background:color-mix(in srgb, #f5a623 22%, #111 78%); box-shadow:0 2px 10px rgba(0,0,0,0.25); }
.dsh-startapus-browser-control button { border:1px solid currentColor; border-radius:5px; background:transparent; color:inherit; font:inherit; padding:2px 8px; cursor:pointer; }
`

interface PanelProps {
  tabKey?: string
  visible?: boolean
  sessionId?: string
  params?: { url?: string }
  onClose?: () => boolean
  onOpenTab?: (url: string) => boolean
  onFocusTab?: (tabId: string) => boolean
  onPick?: (pick: ElementPick) => unknown
}

/** Panel body: chrome + rect reporting, nothing else. */
export function StartapusBrowserPanel(props: PanelProps): React.ReactNode {
  return (
    <PanelBoundary>
      <PanelChrome {...props} />
    </PanelBoundary>
  )
}

function PanelChrome(props: PanelProps): React.ReactNode {
  const tabKey = props.tabKey ?? 'startapus-browser'
  const initialUrl = typeof props.params?.url === 'string' ? props.params.url : 'https://startapus.com'
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [snapshot, setSnapshot] = useState(() => engineState())
  const [draft, setDraft] = useState(initialUrl)
  /** While the address field is focused it is the single source of truth. */
  const [editing, setEditing] = useState(false)
  const [picking, setPicking] = useState(false)
  const [tasksOpen, setTasksOpen] = useState(false)
  const [taskRows, setTaskRows] = useState<Array<{ id: string; problem: string; state: string; attempts: number }>>([])
  const [tasksError, setTasksError] = useState('')
  const pickingRef = useRef(false)

  useEffect(() => {
    notePanelMounted(tabKey)
    return () => notePanelUnmounted(tabKey)
  }, [tabKey])

  useEffect(() => {
    const off = subscribeEngine(() => setSnapshot(engineState()))
    setSnapshot(engineState())
    return off
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (host === null) return
    // Always materialise the page on mount: a tab can be opened in the background,
    // and a guest is only created from a mounted pane. Visibility then decides
    // whether it is shown.
    setPaneState(tabKey, { url: initialUrl, host, visible: props.visible !== false })
    if (props.visible === false) {
      // A tab opened through the controller mounts hidden: front it so the kernel
      // lays the pane out and the guest can attach at all.
      focusStartapusTab(tabKey)
      // Timers are throttled in hidden panes, so try the DOM gesture immediately.
      if (props.visible !== true) activateOwnTab()
    }
    const observer = new ResizeObserver(() => {
      setPaneState(tabKey, { host: hostRef.current, visible: props.visible !== false })
      if (props.visible !== false) setSessionRect(tabKey, true)
    })
    observer.observe(host)
    return () => {
      observer.disconnect()
      // Unmount is not a close: React re-mounts panes (StrictMode, layout moves)
      // and the kernel owns the real teardown. Disposing here left live tabs with
      // no page at all, so the view only hides its container.
      detachSession(tabKey)
    }
  }, [tabKey, initialUrl])

  useEffect(() => {
    // props.visible comes from the kernel and can lag behind reality (a selected tab
    // still reports false). Measure our own layout instead, every tick.
    const paneVisible = (): boolean => {
      let node: HTMLElement | null = hostRef.current
      if (node === null || !node.isConnected) return false
      for (let depth = 0; node !== null && depth < 10; depth += 1) {
        const style = window.getComputedStyle(node)
        if (style.display === 'none' || style.visibility === 'hidden') return false
        const box = node.getBoundingClientRect()
        if (style.display !== 'contents' && (box.width <= 1 || box.height <= 1)) return false
        node = node.parentElement
      }
      return true
    }
    const reportVisibility = (): void => {
      setPaneState(tabKey, { url: initialUrl, host: hostRef.current, visible: paneVisible() })
    }
    reportVisibility()
    const visibilityTimer = window.setInterval(reportVisibility, 700)
    window.addEventListener('resize', reportVisibility)
    return () => {
      window.clearInterval(visibilityTimer)
      window.removeEventListener('resize', reportVisibility)
    }
  }, [tabKey, initialUrl])

  const togglePick = useCallback((): void => {
    const next = !pickingRef.current
    pickingRef.current = next
    setPicking(next)
    setStatus(next ? 'выберите элемент на странице' : 'выбор отменён')
    if (!next) return
    void (async () => {
      try {
        const nonce = `pick-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
        await runInActive(`window.__startapusNonce = ${JSON.stringify(nonce)}`, 3000)
        await runInActive(PICKER_SCRIPT, 10000)
        for (;;) {
          await new Promise((resolve) => setTimeout(resolve, 600))
          if (!pickingRef.current) return
          const raw = await runInActive(PICKER_POLL, 5000).catch(() => null)
          if (typeof raw !== 'string' || raw === '') continue
          const pick = JSON.parse(raw) as ElementPick & { nonce?: string }
          if (pick.nonce !== nonce) {
            setStatus('выбор отклонён: результат не от этой сессии пикера')
            void runInActive('window.__startapusPick = undefined', 2000).catch(() => undefined)
            continue
          }
          void runInActive('window.__startapusPick = undefined', 2000).catch(() => undefined)
          pickingRef.current = false
          setPicking(false)
          setEvidence(pick)
          setStatus(`выбран: ${String(pick.selector).slice(0, 80)}`)
          props.onPick?.(pick)
          return
        }
      } catch (error) {
        pickingRef.current = false
        setPicking(false)
        setStatus(`выбор не удался: ${String(error)}`)
      }
    })()
  }, [props])

  useEffect(() => {
    setTabCloser(tabKey, () => props.onClose?.() === true)
    return () => setTabCloser(tabKey, null)
  }, [tabKey, props])

  useEffect(() => {
    setViewHooks({
      pickRequested: () => togglePick(),
      closeRequested: () => props.onClose?.() === true,
      openTabRequested: (url) => props.onOpenTab?.(url) === true,
      focusTabRequested: (tabId) => props.onFocusTab?.(tabId) === true,
    })
  }, [togglePick, props])

  const navigate = useCallback((next: string): void => {
    const result = openInSession(tabKey, next)
    if (!result.ok) setStatus(`адрес: ${result.reason}`)
  }, [tabKey])

  const go = useCallback((direction: 'back' | 'forward' | 'reload'): void => {
    const guest = guestOf(tabKey) ?? activeGuest()
    if (guest === null) return
    if (direction === 'back') guest.goBack?.()
    else if (direction === 'forward') guest.goForward?.()
    else guest.reload?.()
  }, [tabKey])

  const copyAddress = useCallback((): void => {
    const target = snapshot.url === '' ? draft : snapshot.url
    if (target === '') {
      setStatus('копирование: адрес пуст')
      return
    }
    void navigator.clipboard
      .writeText(target)
      .then(() => setStatus(`скопировано: ${target}`))
      .catch((error: unknown) => setStatus(`копирование не удалось: ${String(error)}`))
  }, [draft, snapshot.url])

  const openExternally = useCallback((): void => {
    const target = snapshot.url === '' ? draft : snapshot.url
    if (!/^https?:/i.test(target)) {
      setStatus('открыть вовне: нужен http(s) адрес')
      return
    }
    window.open(target, '_blank', 'noopener,noreferrer')
    setStatus(`открыто в браузере по умолчанию: ${target}`)
  }, [draft, snapshot.url])

  // Focused: exactly what the user typed (so the field can be cleared).
  // Not focused: the page address, with unsent input as a fallback.
  // With no page yet the field still shows the intended address instead of a
  // placeholder, and focusing it no longer wipes what the user was looking at.
  const desired = desiredUrlFor(tabKey) ?? ''
  const shownUrl = snapshot.url !== '' ? snapshot.url : desired
  const address = editing ? draft : (shownUrl === '' ? draft : shownUrl)

  return (
    <div className="dsh-startapus-browser">
      <style>{STYLES}</style>
      <div className="dsh-startapus-browser-toolbar">
        <button type="button" className="dsh-startapus-browser-btn" onClick={() => go('back')} title="Назад" aria-label="Назад"><FiChevronLeft /></button>
        <button type="button" className="dsh-startapus-browser-btn" onClick={() => go('forward')} title="Вперёд" aria-label="Вперёд"><FiChevronRight /></button>
        <button type="button" className="dsh-startapus-browser-btn" onClick={() => go('reload')} title="Обновить" aria-label="Обновить"><FiRotateCw /></button>
        <input
          className="dsh-startapus-browser-address"
          value={address}
          placeholder="https://…"
          onChange={(event) => setDraft(event.target.value)}
          onFocus={(event) => {
            setDraft(shownUrl)
            setEditing(true)
            event.currentTarget.select()
          }}
          onBlur={() => setEditing(false)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            navigate(draft)
            setEditing(false)
            event.currentTarget.blur()
          }}
          aria-label="Адрес"
        />
        <button
          type="button"
          className="dsh-startapus-browser-btn dsh-startapus-browser-tasksBtn"
          onClick={() => {
            const next = !tasksOpen
            setTasksOpen(next)
            if (!next) return
            setTasksError('')
            void fetch(`${location.origin}/startapus-browser/tasks`)
              .then((response) => response.json())
              .then((body: { tasks?: Array<{ id: string; problem: string; state: string; attempts: number }> }) => {
                setTaskRows(Array.isArray(body.tasks) ? body.tasks.slice(-30).reverse() : [])
              })
              .catch((error: unknown) => setTasksError(String(error)))
          }}
          title="Очередь задач ревью"
          aria-label="Очередь задач ревью"
        >
          Задачи
        </button>
        <button type="button" className="dsh-startapus-browser-btn" onClick={copyAddress} title="Скопировать адрес" aria-label="Скопировать адрес"><FiCopy /></button>
        <button type="button" className="dsh-startapus-browser-btn" onClick={openExternally} title="Открыть в браузере по умолчанию" aria-label="Открыть в браузере по умолчанию"><FiExternalLink /></button>
        <button
          type="button"
          className="dsh-startapus-browser-btn"
          onClick={togglePick}
          title={picking ? 'Отменить выбор' : 'Выделить элемент'}
          aria-label="Выделить элемент"
        >
          <FiCrosshair />
        </button>
      </div>
      {tasksOpen && (
        <div className="dsh-startapus-browser-tasks" role="dialog" aria-label="Очередь задач">
          <div className="dsh-startapus-browser-tasksHead">
            <strong>Очередь задач</strong>
            <button type="button" onClick={() => setTasksOpen(false)}>Закрыть</button>
          </div>
          {tasksError !== '' && <div className="dsh-startapus-browser-tasksErr">{tasksError}</div>}
          {taskRows.length === 0 && tasksError === '' && <div className="dsh-startapus-browser-tasksEmpty">Задач нет</div>}
          <ul>
            {taskRows.map((row) => (
              <li key={row.id}>
                <span className={`dsh-startapus-browser-taskState state-${row.state}`}>{row.state}</span>
                <span className="dsh-startapus-browser-taskText">{row.problem}</span>
                <span className="dsh-startapus-browser-taskMeta">{row.id} · попыток {row.attempts}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(() => {
        const crash = crashedInfo(tabKey)
        if (crash === null) return null
        return (
          <div className="dsh-startapus-browser-crash" role="alert">
            <span>страница остановлена: {crash.reason}. Адрес сохранён.</span>
            <button type="button" onClick={() => restoreCrashedTab(tabKey)}>
              Восстановить
            </button>
          </div>
        )
      })()}
      {(snapshot.agentActive || snapshot.control === 'human') && (
        <div className="dsh-startapus-browser-control">
          <span>
            {snapshot.control === 'human'
              ? 'Управление у вас: действия агента на странице приостановлены'
              : 'Агент управляет страницей'}
          </span>
          <button
            type="button"
            onClick={() => {
              if (snapshot.control === 'human') releaseToAgent()
              else takeHumanControl()
            }}
          >
            {snapshot.control === 'human' ? 'Вернуть агенту' : 'Забрать управление'}
          </button>
        </div>
      )}
      <div ref={hostRef} className="dsh-startapus-browser-host" />
      <div className="dsh-startapus-browser-status">{snapshot.status}</div>
    </div>
  )
}

class PanelBoundary extends Component<{ children: React.ReactNode }, { error: string | null }> {
  state: { error: string | null } = { error: null }

  static getDerivedStateFromError(error: unknown): { error: string } {
    return { error: error instanceof Error ? error.message : String(error) }
  }

  componentDidCatch(error: unknown): void {
    // A render failure here would otherwise look like "the panel is empty".
    setStatus(`панель упала: ${error instanceof Error ? error.message : String(error)}`)
  }

  render(): React.ReactNode {
    if (this.state.error !== null) {
      return (
        <div className="dsh-startapus-browser" style={{ padding: 12, fontSize: 12, lineHeight: 1.5 }}>
          Startapus Browser: панель упала — {this.state.error}
        </div>
      )
    }
    return this.props.children
  }
}
