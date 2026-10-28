#!/usr/bin/env node
/**
 * Live check: proves which build is actually running in the app, then runs the
 * plugin's own acceptance suite on that process.
 *
 * Usage: node scripts/live-check.mjs [port]
 */
import { execSync } from 'node:child_process'
import { CAPABILITIES } from '../lib/index.js'
import { buildRev } from './build-rev.mjs'

function candidatePorts() {
  if (process.argv[2] !== undefined) return [Number(process.argv[2])]
  try {
    const out = execSync(
      "lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null | grep -i deepseek | awk -F: '{print $2}' | awk '{print $1}' | sort -u",
      { encoding: 'utf8' },
    ).trim()
    return out === '' ? [] : out.split('\n').map(Number).filter((n) => Number.isFinite(n))
  } catch {
    return []
  }
}

/** The app listens on several ports; only some serve plugin routes. */
async function discoverPort() {
  for (const port of candidatePorts()) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/startapus-browser/health`, {
        signal: AbortSignal.timeout(1500),
      })
      if (response.ok) return port
    } catch {
      // try the next candidate
    }
  }
  return null
}

const port = await discoverPort()
if (port === null) {
  console.error('FAIL  не найден слушающий порт DSH — приложение не запущено?')
  process.exit(1)
}
console.log(`port: ${port}`)

async function get(path) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, { signal: AbortSignal.timeout(5000) })
  const text = await response.text()
  return { status: response.status, body: text === '' ? null : JSON.parse(text) }
}

let failed = 0

const health = await get('/startapus-browser/health')
if (health.status !== 200) {
  console.error(`FAIL  /health → ${health.status} (плагин не загружен)`)
  process.exit(1)
}
const live = Array.isArray(health.body?.capabilities) ? health.body.capabilities : []
const expectedRev = buildRev()
const liveRev = typeof health.body?.buildRev === 'string' ? health.body.buildRev : 'нет'
let revFresh = true
if (liveRev !== expectedRev) {
  console.log(`STALE  rev: процесс ${liveRev}, исходники ${expectedRev} — сборка в приложении устарела, нужен рестарт`)
  revFresh = false
  failed += 1
}
const missing = CAPABILITIES.filter((flag) => !live.includes(flag))
console.log(`build: ${live.length === 0 ? 'устаревшая (без capabilities)' : `${live.length} флагов`}`)
if (missing.length > 0) {
  console.log(`STALE  не хватает ${missing.length}: ${missing.join(', ')}`)
  failed += 1
} else if (revFresh) {
  console.log('FRESH  сборка совпадает с исходниками (rev)')
}
console.log(`transport: ${String(health.body?.transport)} · stage: ${String(health.body?.stage)} · url: ${String(health.body?.url)}`)
if (health.body?.revMatch === false) {
  console.log(`FAIL  клиент прислал другой отпечаток сборки: ${String(health.body?.clientRev ?? 'нет')} ≠ ${expectedRev}`)
  failed += 1
}
if (health.body?.transport !== true) {
  console.log('WARN  панель не подключена — откройте вкладку Startapus и повторите')
  failed += 1
}

const selftest = await get('/startapus-browser/selftest')
if (selftest.status !== 200 || selftest.body?.ok !== true) {
  console.log(`FAIL  selftest на процессе: ${JSON.stringify(selftest.body).slice(0, 160)}`)
  failed += 1
} else {
  console.log(`selftest: ${selftest.body.total - selftest.body.failed}/${selftest.body.total}`)
}

console.log(failed === 0 ? '\nLIVE OK' : `\nLIVE PROBLEMS: ${failed}`)
process.exit(failed === 0 ? 0 : 1)
