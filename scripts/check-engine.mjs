#!/usr/bin/env node
/**
 * Offline tests for the browser engine (no Electron, no real DOM).
 *
 * The engine owns guests, leases, sessions and the agent channel — exactly the
 * code whose regressions used to be caught only by a live screenshot. This
 * harness stubs `document`/`window`/`window.dshDesktop.browser` and asserts the
 * invariants that broke before:
 *
 *   E1 one acquire per session, one navigation per document
 *   E2 hide/show keeps the same guest (no re-acquire, no reload)
 *   E3 LRU eviction closes the oldest session at the cap
 *   E4 a detached container (zombie guest) is recreated on show
 *   E5 close releases the lease exactly once
 *   E6 titles reach the tab-session list
 *   E7 hidden sessions are not rendered
 */
import { build } from 'esbuild'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

/* ------------------------------------------------------------------ stubs */

class FakeElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase()
    this.style = { cssText: '', display: '', height: '', width: '' }
    this.dataset = {}
    this.attributes = {}
    this.listeners = new Map()
    this.children = []
    this.parent = null
    this.loadedUrls = []
    this.title = ''
    this.url = 'about:blank'
    this.removed = false
  }

  get isConnected() {
    let node = this
    while (node !== null) {
      if (node.tagName === 'BODY') return true
      node = node.parent
    }
    return false
  }

  setAttribute(name, value) { this.attributes[name] = String(value) }
  getAttribute(name) { return this.attributes[name] ?? null }
  addEventListener(name, fn) {
    const set = this.listeners.get(name) ?? new Set()
    set.add(fn)
    this.listeners.set(name, set)
  }
  removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn) }
  fire(name) { for (const fn of [...(this.listeners.get(name) ?? [])]) fn({}) }
  appendChild(child) { child.parent = this; this.children.push(child); return child }
  append(child) { return this.appendChild(child) }
  remove() { this.removed = true; this.parent = null }
  getBoundingClientRect() { return { left: 0, top: 0, width: 600, height: 700 } }
  loadURL(url) { this.loadedUrls.push(url); this.url = url }
  getURL() { return this.url }
  getTitle() { return this.title }
  reload() { this.reloaded = (this.reloaded ?? 0) + 1 }
  setZoomFactor() {}
  getZoomFactor() { return 1 }
  async capturePage() { return { toDataURL: () => 'data:image/png;base64,AA==', getSize: () => ({ width: 10, height: 10 }) } }
  async executeJavaScript() { return '' }
}

const body = new FakeElement('body')
const host = new FakeElement('div')
body.appendChild(host)

const bridgeCalls = { acquire: 0, release: 0 }
let leaseSeq = 0

globalThis.document = {
  body,
  createElement: (tag) => new FakeElement(tag),
  visibilityState: 'visible',
}
globalThis.window = {
  setTimeout: (fn) => { queueMicrotask(() => { try { fn() } catch { /* stub */ } }); return 0 },
  clearTimeout: () => {},
  setInterval: () => 0,
  clearInterval: () => {},
  requestAnimationFrame: (fn) => { fn(); return 0 },
  dispatchEvent: () => {},
  devicePixelRatio: 2,
}
globalThis.window.dshDesktop = {
  browser: {
    async acquire() {
      bridgeCalls.acquire += 1
      leaseSeq += 1
      return { lease: `lease-${leaseSeq}`, partition: 'dsh-sidebar-browser-test' }
    },
    async release() { bridgeCalls.release += 1 },
  },
}

/* ---------------------------------------------------------------- harness */

const out = join(mkdtempSync(join(tmpdir(), 'startapus-engine-')), 'engine.mjs')
await build({
  entryPoints: ['src/client/engine.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
})
const engine = await import(pathToFileURL(out).href)

let failed = 0
const check = async (name, run) => {
  try {
    const detail = await run()
    console.log(`PASS  ${name}${detail === undefined ? '' : ` — ${detail}`}`)
  } catch (error) {
    failed += 1
    console.log(`FAIL  ${name} — ${String(error instanceof Error ? error.message : error)}`)
  }
}
const expect = (condition, message) => { if (!condition) throw new Error(message) }
const guestOf = (tabId) => engine.guestOf(tabId)
const open = async (tabId, url = 'https://example.test/') => {
  await engine.showSession(tabId, url, host)
  const guest = guestOf(tabId)
  guest.fire('dom-ready')
  return guest
}

/* ------------------------------------------------------------------ tests */

await check('E1: одна резервация и одна навигация на сессию', async () => {
  const before = bridgeCalls.acquire
  const guest = await open('t1', 'https://a.example/')
  expect(bridgeCalls.acquire === before + 1, `acquire вызван ${bridgeCalls.acquire - before} раз`)
  expect(guest.loadedUrls.length === 1, `loadURL ${guest.loadedUrls.length} раз`)
  expect(guest.loadedUrls[0] === 'https://a.example/', guest.loadedUrls[0])
  guest.fire('dom-ready')
  expect(guest.loadedUrls.length === 1, 'повторный dom-ready снова навигировал')
  return 'acquire=1, loadURL=1'
})

await check('E2: hide/show сохраняет того же гостя', async () => {
  const guest = guestOf('t1')
  const acquires = bridgeCalls.acquire
  engine.hideSession('t1')
  await engine.showSession('t1', 'https://a.example/', host)
  expect(guestOf('t1') === guest, 'гость пересоздан при переключении')
  expect(bridgeCalls.acquire === acquires, 'новая резервация при переключении')
  return 'тот же гость, без acquire'
})

await check('E3: вытеснение LRU на 7-й сессии', async () => {
  for (const tabId of ['t2', 't3', 't4', 't5', 't6', 't7']) {
    await open(tabId, `https://${tabId}.example/`)
  }
  const tabs = engine.listSessions().map((row) => row.tabId)
  expect(tabs.length <= 6, `сессий ${tabs.length}`)
  expect(!tabs.includes('t1'), 'самая старая сессия не вытеснена')
  expect(bridgeCalls.release >= 1, 'release не вызывался при вытеснении')
  return `осталось ${tabs.length}, вытеснен t1`
})

await check('E4: зомби-гость пересоздаётся при показе', async () => {
  const tabId = 'tz'
  const guest = await open(tabId, 'https://z.example/')
  const container = guest.parent
  container.parent = null
  const acquires = bridgeCalls.acquire
  await engine.showSession(tabId, 'https://z.example/', host)
  expect(bridgeCalls.acquire === acquires + 1, 'acquire не повторился')
  expect(guestOf(tabId) !== guest, 'гость не пересоздан')
  return 'зомби выброшен, новая сессия создана'
})

await check('E5: closeSession освобождает lease один раз', async () => {
  const releases = bridgeCalls.release
  expect(engine.closeSession('tz') === true, 'closeSession вернул false')
  expect(bridgeCalls.release === releases + 1, `release ${bridgeCalls.release - releases} раз`)
  expect(engine.listSessions().every((row) => row.tabId !== 'tz'), 'сессия осталась')
  return 'release=+1'
})

await check('E6: тайтл попадает в сессию', async () => {
  const live = engine.listSessions()[0]
  expect(live !== undefined, 'нет ни одной сессии')
  const guest = guestOf(live.tabId)
  expect(guest !== null, `нет гостя у ${live.tabId}`)
  guest.title = 'Live Page'
  guest.fire('page-title-updated')
  const row = engine.listSessions().find((item) => item.tabId === live.tabId)
  expect(row !== undefined && row.title === 'Live Page', `title=${row?.title}`)
  return `title="${row.title}"`
})

await check('E7: скрытая сессия не рендерится', async () => {
  const live = engine.listSessions()[0]
  engine.hideSession(live.tabId)
  const guest = guestOf(live.tabId)
  const display = guest?.parent?.style?.display
  expect(display === 'none', `display=${display}`)
  return 'display:none'
})

await check('E8: состояние движка отражает сессии', async () => {
  const state = engine.engineState()
  expect(state.tabs === engine.listSessions().length, `tabs=${state.tabs}`)
  expect(typeof state.hasGuest === 'boolean', 'hasGuest не булево')
  return `tabs=${state.tabs}, hasGuest=${state.hasGuest}`
})

await check('E9: мёртвая сессия не маскирует живую', async () => {
  const live = engine.listSessions()[0]
  expect(live !== undefined, 'нет живой сессии')
  // Simulate a ghost session created later but without a guest.
  const ghostHost = new FakeElement('div')
  body.appendChild(ghostHost)
  await engine.showSession('ghost', 'https://ghost.example/', ghostHost)
  const ghostGuest = engine.guestOf('ghost')
  expect(ghostGuest !== null, 'гость ghost не создан')
  ghostGuest.parent.remove()
  expect(engine.activeGuest() !== null, 'activeGuest вернул null при живой сессии')
  return `activeGuest → ${engine.listSessions().find((row) => row.tabId === live.tabId)?.url ?? 'живая сессия'}`
})

await check('E10: навигация адресуется своей сессии', async () => {
  const hostA = new FakeElement('div')
  const hostB = new FakeElement('div')
  body.appendChild(hostA)
  body.appendChild(hostB)
  await engine.showSession('nav-a', 'https://nav-a.example/', hostA)
  await engine.showSession('nav-b', 'https://nav-b.example/', hostB)
  engine.guestOf('nav-a')?.fire('dom-ready')
  engine.guestOf('nav-b')?.fire('dom-ready')
  const guestA = engine.guestOf('nav-a')
  const guestB = engine.guestOf('nav-b')
  expect(guestA !== null && guestB !== null, 'гости не созданы для nav-a/nav-b')
  const beforeB = guestB.loadedUrls.length
  guestA.loadURL('https://nav-a.example/next')
  expect(guestB.loadedUrls.length === beforeB, 'навигация A задела B')
  expect(guestA.loadedUrls.includes('https://nav-a.example/next'), 'навигация A не применилась')
  return 'A навигировался, B не тронут'
})

await check('E11: передача управления меняет состояние', () => {
  engine.takeHumanControl()
  expect(engine.engineState().control === 'human', 'control не стал human')
  engine.releaseToAgent()
  expect(engine.engineState().control === 'agent', 'control не стал agent')
  expect(engine.engineState().agentActive === true, 'agentActive не включился')
  return 'human → agent'
})

await check('E12: параллельная активация = одна сессия и один acquire', async () => {
  const hostRace = new FakeElement('div')
  body.appendChild(hostRace)
  const before = bridgeCalls.acquire
  await Promise.all([
    engine.showSession('race', 'https://race.example/', hostRace),
    engine.showSession('race', 'https://race.example/', hostRace),
    engine.showSession('race', 'https://race.example/', hostRace),
  ])
  const rows = engine.listSessions().filter((row) => row.tabId === 'race')
  expect(rows.length === 1, `сессий race: ${rows.length}`)
  expect(bridgeCalls.acquire === before + 1, `acquire: ${bridgeCalls.acquire - before}`)
  expect(engine.guestOf('race') !== null, 'гость race не создан')
  return '3 вызова → 1 acquire, 1 сессия'
})

await check('E13: падение гостя восстанавливает страницу', async () => {
  const hostCrash = new FakeElement('div')
  body.appendChild(hostCrash)
  await engine.showSession('crash', 'https://crash.example/', hostCrash)
  const guest = engine.guestOf('crash')
  expect(guest !== null, 'гость не создан')
  guest.fire('dom-ready')
  const before = engine.engineState().counters.recoveries
  guest.fire('render-process-gone')
  await new Promise((resolve) => setTimeout(resolve, 20))
  await new Promise((resolve) => setTimeout(resolve, 20))
  const after = engine.engineState().counters.recoveries
  expect(after === before + 1, `recoveries: ${before} → ${after}`)
  const fresh = engine.guestOf('crash')
  expect(fresh !== null && fresh !== guest, 'гость не пересоздан')
  return 'render-process-gone → recoveries+1, новый гость'
})

await check('E14: навигация до dom-ready не падает и применяется после', async () => {
  const hostLate = new FakeElement('div')
  body.appendChild(hostLate)
  await engine.showSession('late', 'https://late.example/', hostLate)
  const guest = engine.guestOf('late')
  expect(guest !== null, 'гость не создан')
  const result = engine.openInSession('late', 'https://late.example/next')
  expect(result.ok === true, `openInSession: ${JSON.stringify(result)}`)
  expect(guest.loadedUrls.length === 0, 'loadURL до dom-ready всё же вызван')
  guest.fire('dom-ready')
  expect(guest.loadedUrls.includes('https://late.example/next'), `после dom-ready: ${JSON.stringify(guest.loadedUrls)}`)
  return 'отложено и применено на dom-ready'
})

if (failed > 0) {
  console.log(`ENGINE FAILED: ${failed}`)
  process.exit(1)
}
console.log('ENGINE OK: 14/14')
