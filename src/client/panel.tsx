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
  disposeSession,
  engineState,
  hideSession,
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
import { forgetClosing, isTabClosing } from './tabs'
import { PICKER_POLL, PICKER_SCRIPT } from './picker-source'


const STYLES = `
.dsh-startapus-browser { display:flex; flex-direction:column; height:100%; min-height:0; font-size:12px; }
.dsh-startapus-browser-toolbar { display:flex; align-items:center; gap:4px; padding:6px 8px; border-bottom:1px solid color-mix(in srgb, currentColor 12%, transparent); }
.dsh-startapus-browser-btn { display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border:none; border-radius:6px; background:transparent; color:inherit; cursor:pointer; }
.dsh-startapus-browser-btn svg { width:16px; height:16px; display:block; }
.dsh-startapus-browser-btn:hover { background:color-mix(in srgb, currentColor 10%, transparent); }
.dsh-startapus-browser-address { flex:1; min-width:0; height:26px; padding:0 8px; border:1px solid color-mix(in srgb, currentColor 18%, transparent); border-radius:6px; background:transparent; color:inherit; font:inherit; outline:none; }
.dsh-startapus-browser-status { padding:4px 10px 8px; opacity:0.72; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-startapus-browser-host { flex:1; min-height:0; }
`

interface PanelProps {
  tabKey?: string
  visible?: boolean
  sessionId?: string
  params?: { url?: string }
  onClose?: () => boolean
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
  const initialUrl = typeof props.params?.url === 'string' ? props.params.url : 'https://ya.ru/'
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [snapshot, setSnapshot] = useState(() => engineState())
  const [draft, setDraft] = useState(initialUrl)
  /** While the address field is focused it is the single source of truth. */
  const [editing, setEditing] = useState(false)
  const [picking, setPicking] = useState(false)
  const pickingRef = useRef(false)

  useEffect(() => {
    notePanelMounted()
    return () => notePanelUnmounted()
  }, [])

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
      if (props.visible === false) hideSession(tabKey)
    })
    const observer = new ResizeObserver(() => {
      if (props.visible !== false) setSessionRect(tabKey, true)
    })
    observer.observe(host)
    return () => {
      observer.disconnect()
      if (isTabClosing(tabKey)) {
        // The kernel is closing this tab and owns the lease: forget the session
        // without releasing it a second time.
        forgetClosing(tabKey)
        disposeSession(tabKey)
      } else {
        detachSession(tabKey)
      }
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
        await runInActive(PICKER_SCRIPT, 10000)
        for (;;) {
          await new Promise((resolve) => setTimeout(resolve, 600))
          if (!pickingRef.current) return
          const raw = await runInActive(PICKER_POLL, 5000).catch(() => null)
          if (typeof raw !== 'string' || raw === '') continue
          const pick = JSON.parse(raw) as ElementPick
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
    })
  }, [togglePick, props])

  const navigate = useCallback((next: string): void => {
    const resolved = normalizeAddress(next)
    if (!resolved.ok) {
      setStatus(`адрес: ${resolved.reason}`)
      return
    }
    activeGuest()?.loadURL?.(resolved.url)
    setStatus(`открываю ${resolved.url}`)
  }, [])

  const go = useCallback((direction: 'back' | 'forward' | 'reload'): void => {
    const guest = activeGuest()
    if (guest === null) return
    if (direction === 'back') guest.goBack?.()
    else if (direction === 'forward') guest.goForward?.()
    else guest.reload?.()
  }, [])

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
          onFocus={() => {
            setDraft(snapshot.url)
            setEditing(true)
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
