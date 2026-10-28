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
import vm from 'node:vm'

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

const scriptsOut = join(mkdtempSync(join(tmpdir(), 'startapus-scripts-')), 'scripts.mjs')
await build({
  entryPoints: ['src/client/verify-scripts.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: scriptsOut,
  logLevel: 'silent',
})
const scripts = await import(pathToFileURL(scriptsOut).href)

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

check('R9: ui_wait — разбор и границы аргументов', () => {
  expect(rules.normalizeWait({}).ok === false, 'пустой запрос принят')
  expect(rules.normalizeWait({ state: 'hidden' }).ok === false, 'state без selector принят')
  expect(rules.normalizeWait({ selector: 'a', state: 'weird' }).ok === false, 'неверный state принят')
  const ok = rules.normalizeWait({ selector: ' #x ', timeoutMs: 999999, idleMs: 1 })
  expect(ok.ok === true && ok.spec.selector === '#x', JSON.stringify(ok))
  expect(ok.spec.timeoutMs === 30000 && ok.spec.idleMs === 100 && ok.spec.state === 'visible', JSON.stringify(ok.spec))
  expect(rules.normalizeWait({ selector: 'a', timeoutMs: 1 }).spec.timeoutMs === 500, 'нижняя граница timeout')
  expect(rules.normalizeWait({ networkIdle: true }).ok === true, 'networkIdle без selector отклонён')
  return 'нет условий/state без selector → отказ; timeout 500–30000, idle 100–5000'
})

const fakeEl = (visible) => ({
  getBoundingClientRect: () => ({ width: visible ? 10 : 0, height: visible ? 10 : 0 }),
})
const runWait = (spec, world) => {
  const context = {
    document: {
      querySelector: (selector) => {
        if (selector === '!!bad') throw new Error('bad selector')
        return world.elements[selector] ?? null
      },
      body: { innerText: world.text ?? '' },
      readyState: world.readyState ?? 'complete',
    },
    getComputedStyle: () => ({ visibility: 'visible', display: 'block' }),
    performance: {
      getEntriesByType: () => (world.resources ?? []).map((end) => ({ responseEnd: end })),
      now: () => world.now ?? 10000,
    },
  }
  return JSON.parse(vm.runInNewContext(scripts.waitScript({ selector: '', state: 'visible', text: '', networkIdle: false, idleMs: 500, ...spec }), context))
}

check('R10: ui_wait — условия страницы (селектор, текст, сеть)', () => {
  const world = { elements: { '#shown': fakeEl(true), '#zero': fakeEl(false) }, text: 'Привет, МИР' }
  expect(runWait({ selector: '#shown' }, world).met === true, 'visible не сработал')
  expect(runWait({ selector: '#zero' }, world).met === false, 'нулевой размер посчитан видимым')
  expect(runWait({ selector: '#zero', state: 'hidden' }, world).met === true, 'hidden не сработал')
  expect(runWait({ selector: '#nope', state: 'hidden' }, world).met === true, 'отсутствующий элемент не hidden')
  expect(runWait({ selector: '#nope', state: 'absent' }, world).met === true, 'absent не сработал')
  expect(runWait({ selector: '#zero', state: 'present' }, world).met === true, 'present не сработал')
  expect(runWait({ selector: '#shown', state: 'absent' }, world).met === false, 'absent при наличии')
  expect(runWait({ text: 'мир' }, world).met === true, 'текст без учёта регистра')
  expect(runWait({ text: 'нет такого' }, world).met === false, 'несуществующий текст найден')
  const both = runWait({ selector: '#shown', text: 'нет такого' }, world)
  expect(both.met === false && both.detail.selector === true && both.detail.text === false, JSON.stringify(both))
  expect(runWait({ networkIdle: true, idleMs: 500 }, { elements: {}, resources: [9000], now: 10000 }).met === true, 'сеть затихла, а met=false')
  expect(runWait({ networkIdle: true, idleMs: 500 }, { elements: {}, resources: [9800], now: 10000 }).met === false, 'свежий запрос не учтён')
  expect(runWait({ networkIdle: true, idleMs: 500 }, { elements: {}, readyState: 'loading', now: 10000 }).met === false, 'loading посчитан готовым')
  const bad = runWait({ selector: '!!bad' }, world)
  expect(bad.status === 'ERROR' && bad.message.includes('bad selector'), JSON.stringify(bad))
  return 'visible/hidden/present/absent, текст, networkIdle, битый селектор → ERROR'
})

const fakeRule = (mediaText, children) => {
  const rule = { media: { mediaText }, cssRules: children }
  return rule
}
check('R11: тема — переписывание media-запросов и откат', () => {
  const dark = fakeRule('screen and (prefers-color-scheme: dark)')
  const light = fakeRule('(prefers-color-scheme: light)')
  const plain = fakeRule('(min-width: 600px)')
  const nested = fakeRule('(prefers-color-scheme: dark)')
  const group = { cssRules: [nested] }
  const blocked = {}
  Object.defineProperty(blocked, 'cssRules', { get() { throw new Error('SecurityError') } })
  const link = { media: 'all and (prefers-color-scheme: dark)', getAttribute(n) { return n === 'media' ? this.media : null }, setAttribute(n, v) { this.media = v }, removeAttribute() { this.media = null } }
  const queries = []
  const root = { style: { colorScheme: '' } }
  const context = {
    document: {
      styleSheets: [{ cssRules: [dark, light, plain, group] }, blocked],
      adoptedStyleSheets: [],
      querySelectorAll: () => [link],
      documentElement: root,
    },
    matchMedia: (query) => { queries.push(query); return { matches: false, media: query } },
  }
  context.window = context
  const call = (mode) => JSON.parse(vm.runInNewContext(scripts.colorSchemeScript(mode), context))

  const result = call('dark')
  expect(result.status === 'OK' && result.patchedRules === 4, JSON.stringify(result))
  expect(result.skippedSheets === 1, `чужой стиль не пропущен: ${JSON.stringify(result)}`)
  expect(dark.media.mediaText === 'screen and (min-width: 0px)', `dark: ${dark.media.mediaText}`)
  expect(light.media.mediaText === '(max-width: -1px)', `light: ${light.media.mediaText}`)
  expect(nested.media.mediaText === '(min-width: 0px)', `вложенный: ${nested.media.mediaText}`)
  expect(plain.media.mediaText === '(min-width: 600px)', 'чужой запрос затронут')
  expect(link.media === 'all and (min-width: 0px)', `link: ${link.media}`)
  expect(root.style.colorScheme === 'dark', `root: ${root.style.colorScheme}`)
  context.matchMedia('(prefers-color-scheme: dark)')
  expect(queries[0] === '(min-width: 0px)', `matchMedia не переписан: ${queries[0]}`)

  const flipped = call('light')
  expect(light.media.mediaText === '(min-width: 0px)' && dark.media.mediaText === 'screen and (max-width: -1px)', 'смена dark→light не переписала правила заново')
  expect(flipped.patchedRules === 4, JSON.stringify(flipped))

  const reset = call('auto')
  expect(reset.patchedRules === 0, JSON.stringify(reset))
  expect(dark.media.mediaText === 'screen and (prefers-color-scheme: dark)', `откат dark: ${dark.media.mediaText}`)
  expect(link.media === 'all and (prefers-color-scheme: dark)', `откат link: ${link.media}`)
  expect(root.style.colorScheme === '', `откат root: ${root.style.colorScheme}`)
  context.matchMedia('(prefers-color-scheme: dark)')
  expect(queries[queries.length - 1] === '(prefers-color-scheme: dark)', 'matchMedia не восстановлен')
  return 'dark/light переписывают 4 запроса (включая вложенный и <link>), auto возвращает оригинал'
})

const runJs = async (code, max) => {
  try {
    return JSON.parse(await vm.runInNewContext(scripts.jsScript(code, max), { document: { title: 'T' } }))
  } catch (error) {
    // A syntax error rejects executeJavaScript itself; the engine reports it as ERROR.
    return { status: 'REJECTED', message: String(error) }
  }
}
const jsValue = await runJs('return document.title')
const jsAsync = await runJs('await Promise.resolve(); return { a: [1, 2], b: undefined }')
const jsNothing = await runJs('const x = 1')
const jsThrow = await runJs('throw new Error("boom")')
const jsCyclic = await runJs('const o = {}; o.self = o; return o')
const jsBig = await runJs('return "x".repeat(50)', 20)
const jsSyntax = await runJs('return (')

check('R12: ui_js — результат, ошибки, усечение', () => {
  expect(jsValue.status === 'OK' && jsValue.json === '"T"', JSON.stringify(jsValue))
  expect(jsAsync.status === 'OK' && jsAsync.json === '{"a":[1,2]}', JSON.stringify(jsAsync))
  expect(jsNothing.status === 'OK' && jsNothing.json === 'null', JSON.stringify(jsNothing))
  expect(jsThrow.status === 'ERROR' && jsThrow.message === 'boom', JSON.stringify(jsThrow))
  expect(jsCyclic.status === 'OK' && jsCyclic.json.startsWith('"'), `цикл не превращён в строку: ${JSON.stringify(jsCyclic)}`)
  expect(jsBig.truncated === true && jsBig.json.length === 20, JSON.stringify(jsBig))
  expect(jsSyntax.status === 'REJECTED' && jsSyntax.message.includes('SyntaxError'), JSON.stringify(jsSyntax))
  return 'значение, async, undefined→null, throw, цикл, усечение'
})

if (failed > 0) {
  console.log(`FAILED: ${failed}`)
  process.exit(1)
}
console.log('RULES OK: 12/12')
