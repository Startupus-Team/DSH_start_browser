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
  const shadowRule = fakeRule('(prefers-color-scheme: dark)')
  const shadow = { styleSheets: [{ cssRules: [shadowRule] }], adoptedStyleSheets: [], querySelectorAll: () => [] }
  const root = { style: { colorScheme: '' } }
  const context = {
    document: {
      styleSheets: [{ cssRules: [dark, light, plain, group] }, blocked],
      adoptedStyleSheets: [],
      querySelectorAll: (selector) => (selector === '*' ? [{ shadowRoot: shadow }] : [link]),
      documentElement: root,
    },
    matchMedia: (query) => { queries.push(query); return { matches: false, media: query } },
  }
  context.window = context
  const call = (mode) => JSON.parse(vm.runInNewContext(scripts.colorSchemeScript(mode), context))

  const result = call('dark')
  expect(result.status === 'OK' && result.patchedRules === 5, JSON.stringify(result))
  expect(shadowRule.media.mediaText === '(min-width: 0px)', `shadow DOM: ${shadowRule.media.mediaText}`)
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
  expect(flipped.patchedRules === 5, JSON.stringify(flipped))

  const reset = call('auto')
  expect(reset.patchedRules === 0, JSON.stringify(reset))
  expect(dark.media.mediaText === 'screen and (prefers-color-scheme: dark)', `откат dark: ${dark.media.mediaText}`)
  expect(shadowRule.media.mediaText === '(prefers-color-scheme: dark)', `откат shadow: ${shadowRule.media.mediaText}`)
  expect(link.media === 'all and (prefers-color-scheme: dark)', `откат link: ${link.media}`)
  expect(root.style.colorScheme === '', `откат root: ${root.style.colorScheme}`)
  context.matchMedia('(prefers-color-scheme: dark)')
  expect(queries[queries.length - 1] === '(prefers-color-scheme: dark)', 'matchMedia не восстановлен')
  return 'dark/light переписывают 5 запросов (вложенный, <link>, shadow DOM), auto возвращает оригинал'
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

const frame = (width, height, paint) => {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let index = 0; index < width * height; index += 1) {
    const [r, g, b] = paint(index % width, Math.floor(index / width))
    data.set([r, g, b, 255], index * 4)
  }
  return data
}
check('R13: diff скриншотов — доля, рамка и порог', () => {
  const white = frame(10, 10, () => [255, 255, 255])
  const same = rules.diffPixels(white, frame(10, 10, () => [255, 255, 255]), 10, 10)
  expect(same.changedPixels === 0 && same.bbox === null && same.changedRatio === 0, JSON.stringify(same))
  const patch = frame(10, 10, (x, y) => (x >= 2 && x <= 4 && y >= 6 && y <= 7 ? [0, 0, 0] : [255, 255, 255]))
  const changed = rules.diffPixels(white, patch, 10, 10)
  expect(changed.changedPixels === 6 && changed.changedRatio === 0.06, JSON.stringify(changed))
  expect(JSON.stringify(changed.bbox) === JSON.stringify({ x: 2, y: 6, width: 3, height: 2 }), JSON.stringify(changed.bbox))
  const noise = rules.diffPixels(white, frame(10, 10, () => [245, 250, 255]), 10, 10)
  expect(noise.changedPixels === 0, `шум ниже порога посчитан изменением: ${JSON.stringify(noise)}`)
  const strict = rules.diffPixels(white, frame(10, 10, () => [245, 250, 255]), 10, 10, 5)
  expect(strict.changedPixels === 100, `порог 5 не сработал: ${JSON.stringify(strict)}`)
  expect(rules.diffPixels([], [], 0, 0).changedRatio === 0, 'пустой кадр')
  expect(rules.captureKey('', '#a') === '*|#a' && rules.captureKey('t1', '') === 't1|', 'ключ снимка')
  return '0 различий, патч 3×2 → 6%, шум <24 игнорируется, порог настраивается'
})

const styleOf = (color, background = 'rgba(0, 0, 0, 0)', image = 'none') => ({ color, backgroundColor: background, backgroundImage: image, display: 'block', visibility: 'visible', getPropertyValue: () => '' })
const node = (style, parent = null, extra = {}) => ({ nodeType: 1, tagName: 'P', parentElement: parent, __style: style, getBoundingClientRect: () => ({ width: 10, height: 10, left: 0, top: 0, right: 10, bottom: 10 }), ...extra })
const runMeasure = (method, el, doc = {}) => JSON.parse(vm.runInNewContext(scripts.measureScript('#t', method, '', ''), {
  document: { querySelectorAll: () => [el], documentElement: doc.documentElement ?? { scrollWidth: 0, clientWidth: 0 }, body: doc.body ?? {} },
  window: { getComputedStyle: (n) => n.__style, innerWidth: 400, innerHeight: 300 },
}))

check('R14: критерии приёмки — контраст, переполнение, область просмотра', () => {
  const page = node(styleOf('rgb(0, 0, 0)', 'rgb(255, 255, 255)'))
  const black = runMeasure('contrast', node(styleOf('rgb(0, 0, 0)'), page))
  expect(black.status === 'OK' && black.value === '21.00', `чёрный на белом: ${JSON.stringify(black)}`)
  const grey = runMeasure('contrast', node(styleOf('rgb(118, 118, 118)'), page))
  expect(grey.value === '4.54', `#767676 на белом: ${JSON.stringify(grey)}`)
  const bare = runMeasure('contrast', node(styleOf('rgb(0, 0, 0)')))
  expect(bare.value === '21.00', `без фона = белый холст: ${JSON.stringify(bare)}`)
  const half = runMeasure('contrast', node(styleOf('rgba(0, 0, 0, 0.5)'), page))
  expect(Number(half.value) > 3.9 && Number(half.value) < 4.1, `полупрозрачный текст: ${JSON.stringify(half)}`)
  const onDark = runMeasure('contrast', node(styleOf('rgb(255, 255, 255)'), node(styleOf('rgb(0,0,0)', 'rgb(17, 17, 17)'), page)))
  expect(Number(onDark.value) > 17, `белый на тёмном: ${JSON.stringify(onDark)}`)
  const photo = runMeasure('contrast', node(styleOf('rgb(0, 0, 0)', 'rgba(0, 0, 0, 0)', 'url(a.png)'), page))
  expect(photo.status === 'UNMEASURABLE' && photo.value.startsWith('E_UNMEASURABLE'), `фон-картинка: ${JSON.stringify(photo)}`)
  const modern = runMeasure('contrast', node(styleOf('oklch(0.5 0.1 200)'), page))
  expect(modern.status === 'UNMEASURABLE', `oklch: ${JSON.stringify(modern)}`)
  const srgb = runMeasure('contrast', node(styleOf('color(srgb 0 0 0)'), page))
  expect(srgb.value === '21.00', `color(srgb): ${JSON.stringify(srgb)}`)

  const wide = node(styleOf('rgb(0,0,0)'), null, { scrollWidth: 500, clientWidth: 400 })
  expect(runMeasure('no-hscroll', wide).value === '100', 'переполнение элемента')
  expect(runMeasure('no-hscroll', node(styleOf('rgb(0,0,0)'), null, { scrollWidth: 300, clientWidth: 400 })).value === '0', 'нет переполнения')
  const root = node(styleOf('rgb(0,0,0)'), null, { scrollWidth: 520, clientWidth: 400 })
  expect(runMeasure('no-hscroll', root, { documentElement: root }).value === '120', 'переполнение страницы (html)')

  const inside = node(styleOf('rgb(0,0,0)'), null, { getBoundingClientRect: () => ({ width: 50, height: 20, left: 10, top: 10, right: 60, bottom: 30 }) })
  const clipped = node(styleOf('rgb(0,0,0)'), null, { getBoundingClientRect: () => ({ width: 50, height: 20, left: 380, top: 10, right: 430, bottom: 30 }) })
  const below = node(styleOf('rgb(0,0,0)'), null, { getBoundingClientRect: () => ({ width: 50, height: 20, left: 10, top: 290, right: 60, bottom: 310 }) })
  expect(runMeasure('in-viewport', inside).value === '1', 'внутри')
  expect(runMeasure('in-viewport', clipped).value === '0', 'обрезан справа')
  expect(runMeasure('in-viewport', below).value === '0', 'ниже экрана')
  return 'контраст 21.00 / 4.54 / альфа / фон-картинка → UNMEASURABLE; переполнение; in-viewport'
})

check('R15: тема запоминается только для dark/light', () => {
  expect(rules.rememberedScheme('dark') === 'dark' && rules.rememberedScheme('light') === 'light', 'dark/light не запомнены')
  expect(rules.rememberedScheme('auto') === null && rules.rememberedScheme(undefined) === null && rules.rememberedScheme('sepia') === null, 'auto/мусор запомнены')
  return 'auto сбрасывает запомненный режим'
})

check('R16: контраст не округляется вверх (WCAG)', () => {
  const lumOf = (g) => { const v = g / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
  const page = node(styleOf('rgb(0, 0, 0)', 'rgb(255, 255, 255)'))
  let near = 0
  for (let g = 100; g <= 200; g += 1) {
    const truth = 1.05 / (lumOf(g) + 0.05)
    const measured = Number(runMeasure('contrast', node(styleOf(`rgb(${g}, ${g}, ${g})`), page)).value)
    expect(measured <= truth + 1e-9, `g=${g}: измерено ${measured} > истинного ${truth}`)
    expect(truth - measured < 0.01 + 1e-9, `g=${g}: усечено слишком сильно (${measured} vs ${truth})`)
    if (truth >= 4.49 && truth < 4.5) near += 1
  }
  return `серые 100..200: значение ≤ истинного и в пределах 0.01 (кандидатов у порога 4.5: ${near})`
})

if (failed > 0) {
  console.log(`FAILED: ${failed}`)
  process.exit(1)
}
console.log('RULES OK: 16/16')
