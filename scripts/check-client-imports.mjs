#!/usr/bin/env node
/**
 * Static import guard for the client bundle.
 *
 * A missing export is invisible to esbuild (it emits a reference to `undefined`)
 * and only shows up as "X is not defined" inside the live pane — exactly how the
 * browser panel broke once. This compares named imports from local modules with
 * the actual exports of those modules.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const files = ['src/client/panel.tsx', 'src/client/index.tsx', 'src/client/engine.ts', 'src/client/tabs.ts', 'src/client/transport.ts']

function exportsOf(path) {
  const source = readFileSync(path, 'utf8')
  const names = new Set()
  for (const match of source.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g)) names.add(match[1])
  for (const match of source.matchAll(/export\s+const\s+([A-Za-z0-9_]+)/g)) names.add(match[1])
  for (const match of source.matchAll(/export\s+(?:let|var)\s+([A-Za-z0-9_]+)/g)) names.add(match[1])
  for (const match of source.matchAll(/export\s+(?:type|interface)\s+([A-Za-z0-9_]+)/g)) names.add(match[1])
  return names
}

function resolveLocal(from, spec) {
  if (!spec.startsWith('.')) return null
  const base = dirname(from)
  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    const candidate = resolve(base, `${spec}${ext}`)
    try {
      readFileSync(candidate)
      return candidate
    } catch {
      // try next extension
    }
  }
  return null
}

let failed = 0
for (const file of files) {
  const source = readFileSync(file, 'utf8')
  const re = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+'([^']+)'/g
  for (const match of source.matchAll(re)) {
    const spec = match[2]
    const target = resolveLocal(file, spec)
    if (target === null) continue
    const exported = exportsOf(target)
    const imported = match[1]
      .split(',')
      .map((row) => row.trim().split(/\s+as\s+/)[0].trim())
      .filter((row) => row !== '' && row !== 'type')
    const missing = imported.filter((name) => !exported.has(name))
    if (missing.length > 0) {
      failed += 1
      console.log(`FAIL  ${file} → ${spec}: нет экспорта ${missing.join(', ')}`)
    }
  }
}

// Shortcut wiring must not silently disappear again (it broke once when the
// listener was replaced by a kernel registration that did not bind).
const indexSource = readFileSync('src/client/index.tsx', 'utf8')
const pickerSource = readFileSync('src/client/picker-source.ts', 'utf8')
const engineSource = readFileSync('src/client/engine.ts', 'utf8')
const pickerChecks = [
  ['нонс в payload пикера', pickerSource.includes('__startapusNonce')],
  ['проверка нонса в панели', readFileSync('src/client/panel.tsx', 'utf8').includes('pick.nonce !== nonce')],
  ['E_GUEST_GONE в движке', engineSource.includes('E_GUEST_GONE')],
  ['пикер по ⌘⇧P', indexSource.includes('startapus-browser.pick') && indexSource.includes('requestPick()')],
  ['экран очереди задач', readFileSync('src/client/panel.tsx', 'utf8').includes('/startapus-browser/tasks')],
]
for (const [name, ok] of pickerChecks) {
  if (!ok) {
    failed += 1
    console.log(`FAIL  пикер: нет «${name}»`)
  }
}

const shortcutChecks = [
  ['keydown listener', indexSource.includes("addEventListener('keydown'")],
  ['обработчик Cmd+T', indexSource.includes("event.key.toLowerCase() !== 't'")],
  ['открытие вкладки', indexSource.includes('requestOpenTab(')],
  ['подсказка в карточке', indexSource.includes('shortcutHint(') && readFileSync('src/client/engine.ts', 'utf8').includes('⌘T')],
]
for (const [name, ok] of shortcutChecks) {
  if (!ok) {
    failed += 1
    console.log(`FAIL  ярлык: нет «${name}» в src/client/index.tsx`)
  }
}

if (failed > 0) {
  console.log(`IMPORTS FAILED: ${failed}`)
  process.exit(1)
}
console.log('IMPORTS OK')
