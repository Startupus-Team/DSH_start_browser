#!/usr/bin/env node
/**
 * Boot guard: a client plugin that throws inside `apply` fails activation and
 * takes the whole app boot down ("entry did not activate"). This runs the real
 * built bundle against a hostile cordis-like context (unknown services throw)
 * and fails if `apply` raises.
 */
import { readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'

const code = readFileSync('lib/client.js', 'utf8')
let captured = null
const sandbox = {
  window: { __ModuleLoader__: { load: (m) => { captured = m } } },
  document: {},
  console,
}
createContext(sandbox)
runInContext(code, sandbox)
if (captured === null) {
  console.log('FAIL  бандл не вызвал __ModuleLoader__.load')
  process.exit(1)
}

const fakeReact = {
  createElement: () => null,
  Fragment: 'f',
  Component: class { constructor(p) { this.props = p; this.state = {} } static getDerivedStateFromError() { return { error: 'x' } } },
  useState: (v) => [v, () => {}],
  useEffect: () => {},
  useRef: (v) => ({ current: v }),
  useCallback: (f) => f,
}
const mod = captured.factory((name) => {
  if (name.startsWith('react')) return fakeReact
  throw new Error(`unexpected require ${name}`)
})

const allowed = new Set(['effect', 'inject', 'slots', 'sidebarRightTabs', 'sidebarRight', 'logger', 'on'])
const target = {
  effect: (fn) => { const d = fn(); return typeof d === 'function' ? d : () => {} },
  inject: (_deps, cb) => cb(target),
  slots: { inject: () => () => {}, register: () => () => {} },
  sidebarRightTabs: { register: () => () => {} },
  logger: { info: () => {} },
}
const host = new Proxy(target, {
  get(obj, key) {
    if (typeof key === 'string' && !allowed.has(key)) throw new Error(`service not available: ${key}`)
    return obj[key]
  },
})

try {
  mod.apply(host)
  console.log('PASS  apply() не бросает при обращении к недоступным сервисам')
  process.exit(0)
} catch (error) {
  console.log(`FAIL  apply() упал: ${String(error instanceof Error ? error.message : error)}`)
  process.exit(1)
}
