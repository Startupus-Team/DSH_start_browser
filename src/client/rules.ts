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

/** Turn what the user typed into a safe http(s) URL. */
export function normalizeAddress(raw: string): AddressResult {
  const value = (raw ?? '').trim()
  if (value === '') return { ok: false, reason: 'пустой адрес' }
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`
  let parsed: URL
  try {
    parsed = new URL(withScheme)
  } catch {
    return { ok: false, reason: `адрес не разобран: ${value}` }
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'разрешены только http(s)' }
  }
  if (PRIVATE_HOST.test(parsed.hostname)) {
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
