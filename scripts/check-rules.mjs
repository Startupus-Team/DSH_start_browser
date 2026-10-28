#!/usr/bin/env node
/**
 * Offline tests for the browser's pure rules (no DOM, no Electron).
 *
 * esbuild transpiles the single TypeScript module, then the rules are asserted
 * directly — regressions in address policy, LRU eviction, verify settle time or
 * crop clamping fail here instead of during a live review.
 */
import { build } from 'esbuild'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const out = join(mkdtempSync(join(tmpdir(), 'startapus-rules-')), 'rules.mjs')
await build({
  entryPoints: ['src/client/rules.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
})
const rules = await import(pathToFileURL(out).href)

let failed = 0
const check = (name, run) => {
  try {
    const detail = run()
    console.log(`PASS  ${name}${detail === undefined ? '' : ` — ${detail}`}`)
  } catch (error) {
    failed += 1
    console.log(`FAIL  ${name} — ${String(error instanceof Error ? error.message : error)}`)
  }
}
const expect = (condition, message) => {
  if (!condition) throw new Error(message)
}

check('R1: схема достраивается до https', () => {
  const result = rules.normalizeAddress('ya.ru')
  expect(result.ok === true, JSON.stringify(result))
  expect(result.url === 'https://ya.ru/', result.url)
  return result.url
})

check('R2: http(s) сохраняется как есть', () => {
  expect(rules.normalizeAddress('http://example.com/a?b=1').url === 'http://example.com/a?b=1', 'http изменён')
  expect(rules.normalizeAddress('https://example.com/').ok === true, 'https отклонён')
  return 'http и https приняты'
})

check('R3: опасные схемы отклоняются', () => {
  for (const raw of ['file:///etc/passwd', 'javascript:alert(1)', 'data:text/html,x']) {
    const result = rules.normalizeAddress(raw)
    expect(result.ok === false, `${raw} принят`)
  }
  return 'file/javascript/data отклонены'
})

check('R4: приватные адреса отклоняются', () => {
  for (const raw of ['http://localhost:3000/', 'http://127.0.0.1/', 'http://192.168.1.2/', 'http://10.0.0.5/']) {
    expect(rules.normalizeAddress(raw).ok === false, `${raw} принят`)
  }
  return 'localhost/127/192.168/10 отклонены'
})

check('R5: мусор и пустое значение', () => {
  expect(rules.normalizeAddress('').ok === false, 'пустое принято')
  expect(rules.normalizeAddress('   ').ok === false, 'пробелы приняты')
  return 'пустое и пробелы отклонены'
})

check('R6: LRU-вытеснение по порогу', () => {
  const ages = [
    { tabId: 'a', lastActiveAt: 300 },
    { tabId: 'b', lastActiveAt: 100 },
    { tabId: 'c', lastActiveAt: 200 },
  ]
  expect(rules.pickSessionToEvict(ages, 4) === null, 'вытеснение ниже порога')
  expect(rules.pickSessionToEvict(ages, 3) === 'b', 'вытеснена не самая старая')
  expect(rules.pickSessionToEvict([], 6) === null, 'пустой пул')
  return 'cap 3 → b, cap 4 → никого'
})

check('R7: reload у verify — только по явному флагу', () => {
  expect(rules.verifyNeedsReload({}) === false, 'reload по умолчанию включён')
  expect(rules.verifyNeedsReload({ reload: true }) === true, 'reload не включился')
  expect(rules.verifySettleMs(false) === 250, 'settle без reload')
  expect(rules.verifySettleMs(true) === 1500, 'settle с reload')
  return 'по умолчанию settle 250 мс без перезагрузки'
})

check('R8: кроп зажимается в границы изображения', () => {
  const rect = rules.cropRect({ x: 900, y: 900, width: 400, height: 400 }, 1, { width: 1000, height: 1000 })
  expect(rect.sx + rect.sw <= 1000, `sw выход за границу: ${JSON.stringify(rect)}`)
  expect(rect.sy + rect.sh <= 1000, `sh выход за границу: ${JSON.stringify(rect)}`)
  const scaled = rules.cropRect({ x: 10, y: 20, width: 30, height: 40 }, 2, { width: 200, height: 200 })
  expect(scaled.sx === 20 && scaled.sy === 40 && scaled.sw === 60 && scaled.sh === 80, JSON.stringify(scaled))
  const broken = rules.cropRect({ x: 0, y: 0, width: 10, height: 10 }, Number.NaN, { width: 50, height: 50 })
  expect(broken.sw === 10, `ratio NaN: ${JSON.stringify(broken)}`)
  return 'границы и масштаб соблюдены'
})

if (failed > 0) {
  console.log(`FAILED: ${failed}`)
  process.exit(1)
}
console.log('RULES OK: 8/8')
