#!/usr/bin/env node
/**
 * Syntax-check the scripts injected into the guest page.
 *
 * A malformed generated script surfaces only at runtime as
 * "Script failed to execute" inside the guest, so it is parsed here first.
 */
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const result = await build({
  entryPoints: ['src/client/verify-scripts.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  logLevel: 'silent',
})

const code = result.outputFiles[0].text
const dir = mkdtempSync(join(tmpdir(), 'startapus-scripts-'))
const file = join(dir, 'verify-scripts.mjs')
writeFileSync(file, code, 'utf8')
const module = await import(pathToFileURL(file).href)

const cases = [
  ['measure/computed', module.measureScript('div#a > p', 'computed', 'gap', 'p')],
  ['measure/text', module.measureScript('p', 'text', 'textContent', '')],
  ['measure/box', module.measureScript('p', 'box', 'width', 'p')],
  ['measure/visible', module.measureScript('p', 'visible', 'display', 'p')],
  ['coverage', module.coverageScript([{ tag: 'div', id: 'a', classes: 'card big' }])],
  ['evidence', module.evidenceScript('main > p')],
  ['act/click', module.actScript('click', 'button', '')],
  ['act/type', module.actScript('type', 'input', 'привет')],
  ['act/scroll', module.actScript('scroll', '', '420')],
  ['page-scan', module.pageScanScript(120)],
  ['page-text', module.pageTextScript(4000)],
  ['network', module.networkScript(100)],
  ['inspect', module.inspectScript('a', ['color'])],
]

let failed = 0
for (const [name, script] of cases) {
  try {
    // Parse only: no execution, so DOM references are irrelevant.
    new Function(script)
    console.log(`PASS  ${name} — скрипт синтаксически корректен (${script.length} символов)`)
  } catch (error) {
    failed += 1
    console.log(`FAIL  ${name} — ${String(error instanceof Error ? error.message : error)}`)
  }
}

console.log(failed === 0 ? `\nSCRIPT OK: ${cases.length}/${cases.length}` : `\nSCRIPT FAILED: ${failed}`)
process.exit(failed === 0 ? 0 : 1)
