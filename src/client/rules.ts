/**
 * Pure decision rules of the browser: no DOM, no Electron, no channels.
 *
 * Keeping them here (and covering them with `scripts/check-rules.mjs`) means a
 * regression in address policy, session eviction or verification settle time is
 * caught offline instead of during a live review.
 *
 * @module startapus-browser/client/rules
 */

/** Resolved navigation request. */
export type AddressResult =
  | { ok: true; url: string }
  | { ok: false; reason: string }

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/

/** Schemes that are recognised (and refused) even without `//`, so `host:port` is not mistaken for one. */
const NAMED_SCHEME = /^(javascript|data|file|about|mailto|blob|view-source|chrome|chrome-extension|ftp|ws|wss|tel|sms):/i

/** Hosts a person types for local development: they get plain http by default (dev servers rarely have TLS). */
const LOCAL_DEV_HOST = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/i

/**
 * Turn what was typed into a safe http(s) URL.
 *
 * `allowPrivate` is for the person typing in the address bar: localhost and LAN
 * addresses are what they develop against. The agent's tools keep the default
 * (blocked), which is the SSRF guard.
 */
export function normalizeAddress(raw: string, options: { allowPrivate?: boolean } = {}): AddressResult {
  const value = (raw ?? '').trim()
  if (value === '') return { ok: false, reason: 'пустой адрес' }
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) || NAMED_SCHEME.test(value)
  const defaultScheme = LOCAL_DEV_HOST.test(value) ? 'http' : 'https'
  const withScheme = hasScheme ? value : `${defaultScheme}://${value}`
  let parsed: URL
  try {
    parsed = new URL(withScheme)
  } catch {
    return { ok: false, reason: `адрес не разобран: ${value}` }
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'разрешены только http(s)' }
  }
  if (options.allowPrivate !== true && PRIVATE_HOST.test(parsed.hostname)) {
    return { ok: false, reason: 'приватные адреса заблокированы' }
  }
  return { ok: true, url: parsed.toString() }
}

/** Session shape the eviction rule needs. */
export interface SessionAge {
  tabId: string
  lastActiveAt: number
}

/** Least recently used session, or null while under the cap. */
export function pickSessionToEvict(ages: readonly SessionAge[], cap: number): string | null {
  if (ages.length < cap) return null
  const oldest = [...ages].sort((a, b) => a.lastActiveAt - b.lastActiveAt)[0]
  return oldest === undefined ? null : oldest.tabId
}

/** Whether verification must reload the page (destructive for the reviewer). */
export function verifyNeedsReload(args: Record<string, unknown>): boolean {
  return args.reload === true
}

/** Settle time before measuring: reload needs longer than a plain settle. */
export function verifySettleMs(reload: boolean): number {
  return reload ? 1500 : 250
}

/** Crop rectangle in image pixels, clamped to the image bounds. */
export function cropRect(
  rect: { x: number; y: number; width: number; height: number },
  ratio: number,
  image: { width: number; height: number },
): { sx: number; sy: number; sw: number; sh: number } {
  const scale = Number.isFinite(ratio) && ratio > 0 ? ratio : 1
  const sx = Math.max(0, Math.min(image.width - 1, Math.round(rect.x * scale)))
  const sy = Math.max(0, Math.min(image.height - 1, Math.round(rect.y * scale)))
  const sw = Math.max(1, Math.min(image.width - sx, Math.round(rect.width * scale)))
  const sh = Math.max(1, Math.min(image.height - sy, Math.round(rect.height * scale)))
  return { sx, sy, sw, sh }
}

/** Normalised `ui_wait` request. */
export interface WaitSpec {
  selector: string
  state: 'visible' | 'hidden' | 'present' | 'absent'
  text: string
  networkIdle: boolean
  idleMs: number
  timeoutMs: number
}

export type WaitSpecResult = { ok: true; spec: WaitSpec } | { ok: false; reason: string }

export const WAIT_STATES = ['visible', 'hidden', 'present', 'absent'] as const
export const WAIT_MAX_MS = 30_000

/** Validate and clamp `ui_wait` arguments; at least one condition is required. */
export function normalizeWait(args: Record<string, unknown>): WaitSpecResult {
  const selector = typeof args.selector === 'string' ? args.selector.trim() : ''
  const text = typeof args.text === 'string' ? args.text.trim() : ''
  const networkIdle = args.networkIdle === true
  if (selector === '' && text === '' && !networkIdle) {
    return { ok: false, reason: 'нужно хотя бы одно условие: selector, text или networkIdle' }
  }
  const rawState = typeof args.state === 'string' ? args.state : 'visible'
  if (!(WAIT_STATES as readonly string[]).includes(rawState)) {
    return { ok: false, reason: `state должен быть ${WAIT_STATES.join(' | ')}` }
  }
  if (selector === '' && typeof args.state === 'string') {
    return { ok: false, reason: 'state имеет смысл только вместе с selector' }
  }
  const timeout = typeof args.timeoutMs === 'number' && Number.isFinite(args.timeoutMs) ? args.timeoutMs : 10_000
  const idle = typeof args.idleMs === 'number' && Number.isFinite(args.idleMs) ? args.idleMs : 500
  return {
    ok: true,
    spec: {
      selector,
      state: rawState as WaitSpec['state'],
      text,
      networkIdle,
      idleMs: Math.min(5000, Math.max(100, Math.round(idle))),
      timeoutMs: Math.min(WAIT_MAX_MS, Math.max(500, Math.round(timeout))),
    },
  }
}

export const COLOR_SCHEMES = ['dark', 'light', 'auto'] as const

/** Result of comparing two RGBA frames of equal size. */
export interface PixelDiff {
  changedPixels: number
  totalPixels: number
  changedRatio: number
  /** Bounding box of changed pixels, or null when nothing changed. */
  bbox: { x: number; y: number; width: number; height: number } | null
}

/**
 * Compare two RGBA buffers. A pixel counts as changed when any channel differs by
 * more than `threshold` (anti-aliasing noise stays below the default).
 */
export function diffPixels(
  before: ArrayLike<number>,
  after: ArrayLike<number>,
  width: number,
  height: number,
  threshold = 24,
): PixelDiff {
  const total = Math.max(0, width * height)
  let changed = 0
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let index = 0; index < total; index += 1) {
    const offset = index * 4
    if (
      Math.abs(before[offset] - after[offset]) > threshold
      || Math.abs(before[offset + 1] - after[offset + 1]) > threshold
      || Math.abs(before[offset + 2] - after[offset + 2]) > threshold
      || Math.abs(before[offset + 3] - after[offset + 3]) > threshold
    ) {
      changed += 1
      const x = index % width
      const y = Math.floor(index / width)
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return {
    changedPixels: changed,
    totalPixels: total,
    changedRatio: total === 0 ? 0 : Math.round((changed / total) * 10000) / 10000,
    bbox: changed === 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
  }
}

/** Key under which the previous screenshot of the same target is remembered. */
export function captureKey(tabId: string, selector: string): string {
  return `${tabId === '' ? '*' : tabId}|${selector}`
}

/** Colour scheme a session keeps re-applying after navigations; `auto` forgets it. */
export function rememberedScheme(mode: unknown): 'dark' | 'light' | null {
  return mode === 'dark' || mode === 'light' ? mode : null
}

/** Operations `ui_act` accepts; shared so the single and batch paths cannot drift. */
export const ACT_OPS = ['click', 'type', 'scroll', 'press', 'hover', 'select', 'check', 'drag', 'click_at'] as const
export type ActOp = typeof ACT_OPS[number]

/** Operations that need a target element (everything except `scroll`). */
export function actNeedsTarget(op: string): boolean {
  return op !== 'scroll' && op !== 'click_at'
}

export const NAV_ACTIONS = ['back', 'forward', 'reload'] as const
