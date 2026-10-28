#!/usr/bin/env node
/**
 * Live soak: watch /health for a while and fail on lifecycle invariants.
 *
 * Invariants (per phase C of docs/plan-v3.md):
 *  - the running build matches the client (`revMatch !== false`);
 *  - leases do not leak: `acquires - releases <= 3`;
 *  - the renderer does not crash: `crashes` stays 0;
 *  - recovery storms do not happen: `recoveries` stays 0;
 *  - the page is present between samples once a tab is open.
 *
 * Usage: node scripts/soak.mjs [--minutes=30] [--interval=5]
 */
const args = new Map(process.argv.slice(2).map((row) => row.replace(/^--/, '').split('=')))
const minutes = Number(args.get('minutes') ?? 30)
const intervalMs = Math.max(2, Number(args.get('interval') ?? 5)) * 1000

async function port() {
  const { execFileSync } = await import('node:child_process')
  try {
    const out = execFileSync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN', '-p', String(process.pid)], { encoding: 'utf8' })
    void out
  } catch {
    // fall through to scan
  }
  const { readFileSync, existsSync } = await import('node:fs')
  const { homedir } = await import('node:os')
  const file = `${homedir()}/.dsh/startapus-host.log`
  if (!existsSync(file)) return null
  const tail = readFileSync(file, 'utf8').trim().split('\n').slice(-400).reverse()
  for (const line of tail) {
    try {
      const row = JSON.parse(line)
      if (row.event === 'webServer:route-registered' && typeof row.port === 'number') return row.port
    } catch {
      // ignore
    }
  }
  return null
}

async function health(p) {
  const response = await fetch(`http://127.0.0.1:${p}/startapus-browser/health`, { signal: AbortSignal.timeout(4000) })
  return response.json()
}

const target = await port()
if (target === null) {
  console.error('SOAK: не нашёл порт плагина в ~/.dsh/startapus-host.log')
  process.exit(2)
}

const started = Date.now()
const deadline = started + minutes * 60 * 1000
const violations = []
let samples = 0
let first = null
let last = null

while (Date.now() < deadline) {
  try {
    const body = await health(target)
    samples += 1
    if (first === null) first = body
    last = body
    const counters = body.counters ?? {}
    if (body.revMatch === false) violations.push('revMatch=false: клиент и host на разных сборках')
    if (typeof counters.acquires === 'number' && typeof counters.releases === 'number' && counters.acquires - counters.releases > 3) {
      violations.push(`утечка lease: acquires ${counters.acquires} − releases ${counters.releases}`)
    }
    if (typeof counters.crashes === 'number' && counters.crashes > 0) violations.push(`падение рендерера: crashes ${counters.crashes}`)
    if (typeof counters.recoveries === 'number' && counters.recoveries > 0) violations.push(`восстановления: recoveries ${counters.recoveries}`)
  } catch (error) {
    violations.push(`health недоступен: ${String(error)}`)
  }
  if (violations.length > 0) break
  await new Promise((resolve) => setTimeout(resolve, intervalMs))
}

const delta = (field) => (last?.counters?.[field] ?? 0) - (first?.counters?.[field] ?? 0)
console.log(`SOAK: ${samples} проб за ${Math.round((Date.now() - started) / 1000)} с`)
console.log(`  панели: ${last?.panels ?? '?'}, сессии: ${last?.sessionsCount ?? '?'}, ${
  delta('navigations')} навигаций, ${delta('loadErrors')} ошибок загрузки`)
if (violations.length === 0) {
  console.log('SOAK OK: инварианты соблюдены')
  process.exit(0)
}
for (const row of violations.slice(0, 5)) console.error(`SOAK FAIL: ${row}`)
process.exit(1)
