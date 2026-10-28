/**
 * Startapus Browser — renderer side of the host transport.
 *
 * The panel long-polls a plugin route for commands (`open`, `pick`, `reload`)
 * and reports its state back. The route is served by the host half
 * (`/startapus-browser/*`); the renderer discovers the working base once and
 * reuses it.
 *
 * The desktop renderer holds an auth token (`window.dsh.getAuthToken()`), which
 * every request carries — a route without the token is rejected by the gateway.
 *
 * @module startapus-browser/client/transport
 */

/** One command produced by an agent tool. */
export interface BridgeCommand {
  id: string
  kind: 'open' | 'pick' | 'reload' | 'viewport'
  args: Record<string, unknown>
}

/** Candidate bases, tried in order until one answers `/health`. */
const BASES = ['', 'dsh-app://app']

/** Host build revision reported by the last poll ('' until known). */
export let lastHostRev = ''

/** Which Startapus tab this panel instance is. */
let currentTab = 'startapus-browser'

/** Declare the tab identity used by every request. */
export function setTab(key: string): void {
  if (typeof key === 'string' && key !== '') currentTab = key
}

function authHeaders(): Record<string, string> {
  // Marks the request as coming from our panel; the host rejects other clients.
  return { 'x-startapus-client': '1' }
}

function unusedAuthHeaders(): Record<string, string> {
  try {
    const api = (window as unknown as { dsh?: { getAuthToken?: () => string } }).dsh
    const token = api?.getAuthToken?.()
    return typeof token === 'string' && token !== '' ? { authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

/** Find a base that serves the plugin route, or `null`. */
export async function probe(): Promise<string | null> {
  for (const base of BASES) {
    try {
      const response = await fetch(`${base}/startapus-browser/health`, { headers: authHeaders() })
      if (response.ok) return base
    } catch {
      // try the next base
    }
  }
  return null
}

/** Take the next queued command, or `null` when the queue is empty. */
export async function poll(base: string): Promise<BridgeCommand | null> {
  try {
    const response = await fetch(`${base}/startapus-browser/client/poll`, {
      method: 'POST',
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ tabKey: currentTab, wait: true }),
    })
    if (!response.ok) return null
    if (response.status === 204) {
      try {
        const empty = (await response.json()) as { hostRev?: string }
        if (typeof empty.hostRev === 'string') lastHostRev = empty.hostRev
      } catch {
        // 204 has no body in older builds
      }
      return null
    }
    const body = (await response.json()) as { command?: BridgeCommand; hostRev?: string }
    if (typeof body.hostRev === 'string') lastHostRev = body.hostRev
    return body.command ?? null
  } catch {
    return null
  }
}

/** Send a named diagnostic note to the host log (`apply:probe` style). */
export async function note(name: string, data: Record<string, unknown> = {}): Promise<void> {
  const base = await probe()
  if (base === null) return
  try {
    await fetch(`${base}/startapus-browser/client/event`, {
      method: 'POST',
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ note: { name, data, at: Date.now() } }),
    })
  } catch {
    // diagnostics must never break the panel
  }
}

/** Report panel state and evidence back to the host half. */
export async function report(base: string, payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${base}/startapus-browser/client/event`, {
      method: 'POST',
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ ...payload, tabKey: currentTab }),
    })
  } catch {
    // the next tick retries
  }
}
