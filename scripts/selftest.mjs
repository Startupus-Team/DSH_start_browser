#!/usr/bin/env node
/**
 * Offline acceptance harness: loads the built host bundle and runs both suites
 * the plugin exposes (`/startapus-browser/selftest` and the verify engine).
 *
 * Usage: node scripts/selftest.mjs
 */
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'

// Offline suites must never touch the live queue on disk.
const store = join(tmpdir(), `startapus-selftest-${process.pid}.json`)
process.env.STARTAPUS_STORE = store
// Offline suites must not write into the live diagnostic log either.
process.env.STARTAPUS_HOST_LOG = join(tmpdir(), `startapus-selftest-${process.pid}.log`)

const module = await import(new URL('../lib/index.js', import.meta.url).href)

const suites = [
  ['gates + comparator', module.runSelfTest()],
  ['verify engine', await module.runVerifySelftest()],
  ['soak + hardening', await module.runSoakSelftest()],
]

let failed = 0
for (const [title, report] of suites) {
  console.log(`\n== ${title} ==`)
  for (const row of report.results) {
    console.log(`${row.pass ? 'PASS' : 'FAIL'}  ${row.name} — ${row.detail}`)
  }
  failed += report.failed
}

const total = suites.reduce((sum, [, report]) => sum + report.total, 0)
console.log(`\n${failed === 0 ? 'OK' : 'FAILED'}: ${total - failed}/${total}`)
rmSync(store, { force: true })
process.exit(failed === 0 ? 0 : 1)
