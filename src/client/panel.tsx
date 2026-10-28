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
  hideSession,
  openInSession,
  releaseToAgent,
  takeHumanControl,
  notePanelMounted,
  notePanelUnmounted,
  runInActive,
  showSession,
  setEvidence,
  setSessionRect,
  setStatus,
  setViewHooks,
  subscribeEngine,
} from './engine'
import { normalizeAddress } from './rules'
import { activateOwnTab } from './engine'
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
    void showSession(tabKey, initialUrl, host).then(() => {
      if (props.visible === false) {
        hideSession(tabKey)
        // A tab opened through the controller mounts hidden: front it so the kernel
        // lays the pane out and the guest can attach at all.
        focusStartapusTab(tabKey)
        // `focus(tabId)` is not always available in the plugin context; clicking the
        // tab in the strip is the gesture the kernel definitely handles.
        window.setTimeout(() => {
          if (props.visible !== true) activateOwnTab()
        }, 400)
      }
    })
    const observer = new ResizeObserver(() => {
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
    if (props.visible === true) {
      void showSession(tabKey, initialUrl, hostRef.current)
    } else if (props.visible === false) {
      hideSession(tabKey)
    }
  }, [props.visible, tabKey, initialUrl])

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
  const address = editing ? draft : (snapshot.url === '' ? draft : snapshot.url)

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
            setDraft(snapshot.url)
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
