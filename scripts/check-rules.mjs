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

const sizeOut = join(mkdtempSync(join(tmpdir(), 'startapus-size-')), 'size.mjs')
await build({ entryPoints: ['src/image-size.ts'], bundle: true, format: 'esm', platform: 'node', outfile: sizeOut, logLevel: 'silent' })
const { imageSize } = await import(pathToFileURL(sizeOut).href)

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

class FakeEvent { constructor(type, init = {}) { this.type = type; Object.assign(this, init) } }
const runAct = (op, selector, value, el) => {
  const events = []
  if (el) el.dispatchEvent = (event) => { events.push(event.type); return true }
  const context = {
    document: { querySelector: () => el ?? null, activeElement: null, body: {} },
    window: { scrollTo() {} },
    Event: FakeEvent, MouseEvent: FakeEvent, InputEvent: FakeEvent, KeyboardEvent: FakeEvent, PointerEvent: FakeEvent,
    HTMLInputElement: class {}, HTMLTextAreaElement: class {},
  }
  const result = JSON.parse(vm.runInNewContext(scripts.actScript(op, selector, value), context))
  return { result, events }
}
const baseEl = () => ({ scrollIntoView() {}, focus() {}, click() { this.clicked = (this.clicked ?? 0) + 1 }, getBoundingClientRect: () => ({ left: 10, top: 10, width: 20, height: 10 }), getAttribute: () => null })

check('R17: ui_act — hover, select, check', () => {
  const hover = runAct('hover', '#h', '', baseEl())
  expect(hover.result.status === 'OK', JSON.stringify(hover.result))
  expect(['pointerover', 'pointerenter', 'pointermove', 'mouseover', 'mouseenter', 'mousemove'].every((name) => hover.events.includes(name)), `события hover: ${hover.events}`)
  expect(runAct('hover', '#h', '', null).result.status === 'MISSING', 'hover без элемента')

  const options = [{ value: 'a', text: ' Alpha ' }, { value: 'b', text: 'Beta' }, { value: 'c', text: 'Gamma', disabled: true }]
  const pick = (value) => runAct('select', '#s', value, { ...baseEl(), options, selectedIndex: 0, get value() { return options[this.selectedIndex].value } })
  const byValue = pick('b')
  expect(byValue.result.status === 'OK' && byValue.result.value === 'b' && byValue.events.includes('change'), JSON.stringify(byValue))
  expect(pick('Alpha').result.value === 'a', 'выбор по тексту (с обрезкой пробелов)')
  const multi = { ...baseEl(), options: options.map((o) => ({ ...o, selected: false })), multiple: true, selectedIndex: -1, get value() { return '' } }
  runAct('select', '#m', 'a', multi)
  runAct('select', '#m', 'b', multi)
  expect(multi.options[0].selected && multi.options[1].selected, 'multiple: оба варианта должны остаться выбранными')
  const missing = pick('zzz')
  expect(missing.result.status === 'ERROR' && missing.result.message.includes('a=Alpha'), JSON.stringify(missing.result))
  expect(pick('c').result.message === 'вариант отключён', 'отключённый вариант')
  expect(runAct('select', '#s', 'a', baseEl()).result.message === 'элемент не <select>', 'не select')

  const box = (checked, extra = {}) => ({ ...baseEl(), checked, type: 'checkbox', disabled: false, click() { this.checked = !this.checked }, ...extra })
  const on = runAct('check', '#c', 'true', box(false))
  expect(on.result.status === 'OK' && on.result.checked === true, JSON.stringify(on.result))
  const already = box(true)
  runAct('check', '#c', 'true', already)
  expect(already.checked === true, 'повторный check снял галочку')
  const off = runAct('check', '#c', 'false', box(true))
  expect(off.result.checked === false, JSON.stringify(off.result))
  expect(runAct('check', '#c', 'true', box(false, { disabled: true })).result.message === 'элемент отключён', 'отключённый чекбокс')
  const radio = runAct('check', '#r', 'false', box(true, { type: 'radio' }))
  expect(radio.result.status === 'ERROR' && radio.result.message.includes('радио'), JSON.stringify(radio.result))
  const stubborn = runAct('check', '#c', 'true', box(false, { click() {} }))
  expect(stubborn.result.status === 'ERROR' && stubborn.result.message.includes('не изменилось'), JSON.stringify(stubborn.result))
  const aria = { ...baseEl(), checked: undefined, state: 'false', getAttribute(name) { return name === 'aria-checked' ? this.state : null }, click() { this.state = this.state === 'true' ? 'false' : 'true' } }
  expect(runAct('check', '#sw', 'true', aria).result.checked === true, 'aria-checked переключатель')
  expect(runAct('check', '#x', 'true', baseEl()).result.message.includes('не чекбокс'), 'не чекбокс')
  return 'hover-события, select по value/тексту/ошибки, check для native/radio/aria'
})

const hookWorld = async () => {
  class FakeXhr {
    constructor() { this.listeners = {}; this.status = 0 }
    open() {}
    send() {}
    addEventListener(name, fn) { this.listeners[name] = fn }
    finish(status) { this.status = status; this.listeners.loadend?.() }
  }
  const context = {
    performance: { now: () => 1000, getEntriesByType: () => [] },
    fetch: (input) => (String(input).includes('abort') ? Promise.reject(Object.assign(new Error('aborted'), { name: 'AbortError' })) : String(input).includes('boom') ? Promise.reject(new Error('Failed to fetch')) : Promise.resolve({ status: String(input).includes('missing') ? 404 : 200, ok: !String(input).includes('missing') })),
    XMLHttpRequest: FakeXhr,
  }
  context.window = context
  const installed = JSON.parse(vm.runInNewContext(scripts.netHookScript(), context))
  const again = JSON.parse(vm.runInNewContext(scripts.netHookScript(), context))
  await context.fetch('https://x.test/ok')
  await context.fetch('https://x.test/missing', { method: 'post' })
  await context.fetch('https://x.test/boom').catch(() => undefined)
  await context.fetch('https://x.test/abort').catch(() => undefined)
  const xhr = new context.XMLHttpRequest()
  xhr.open('get', 'https://x.test/xhr')
  xhr.send()
  xhr.finish(500)
  const report = JSON.parse(vm.runInNewContext(scripts.networkScript(50), context))
  return { installed, again, report }
}
const hooked = await hookWorld()
check('R18: ui_network — статусы fetch/XHR через хук', () => {
  expect(hooked.installed.installed === true && hooked.again.installed === false, `идемпотентность: ${JSON.stringify([hooked.installed, hooked.again])}`)
  const { report } = hooked
  expect(report.hooked === true && report.requests.length === 5, JSON.stringify(report.requests))
  const [ok, missing, boom, aborted, xhr] = report.requests
  expect(aborted.aborted === true, `AbortError не помечен: ${JSON.stringify(aborted)}`)
  expect(ok.status === 200 && ok.ok === true && ok.method === 'GET', JSON.stringify(ok))
  expect(missing.status === 404 && missing.method === 'POST', JSON.stringify(missing))
  expect(boom.status === 0 && boom.error === 'Failed to fetch', JSON.stringify(boom))
  expect(xhr.kind === 'xhr' && xhr.status === 500 && xhr.method === 'GET', JSON.stringify(xhr))
  expect(report.failedRequests === 3, `failedRequests=${report.failedRequests}`)
  return '200/404/сбой/отмена/XHR 500 → 3 неудачных (отмена не в счёт), повторная установка не дублирует хук'
})
check('R19: networkScript без хука не падает', () => {
  const plain = JSON.parse(vm.runInNewContext(scripts.networkScript(10), { performance: { getEntriesByType: () => [{ name: 'a', initiatorType: 'img', duration: 500, transferSize: 300000, startTime: 1 }] }, window: {} }))
  expect(plain.hooked === false && plain.requests.length === 0 && plain.slow === 1 && plain.heavy === 1, JSON.stringify(plain))
  return 'hooked=false, resource timing сохранён'
})

check('R20: размер изображения из заголовка PNG/JPEG', () => {
  const png = Buffer.alloc(33)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png)
  png.writeUInt32BE(1322, 16)
  png.writeUInt32BE(1958, 20)
  const p = imageSize(png)
  expect(p?.width === 1322 && p?.height === 1958, JSON.stringify(p))
  // JPEG: SOI, an APP0 segment to skip, then SOF0 (height 480, width 640).
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0xe0, 0x02, 0x80, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01])
  const j = imageSize(jpeg)
  expect(j?.width === 640 && j?.height === 480, JSON.stringify(j))
  expect(imageSize(Buffer.from('not an image at all, just text')) === null, 'мусор принят за картинку')
  expect(imageSize(Buffer.alloc(0)) === null && imageSize(Buffer.from([0x89, 0x50])) === null, 'обрезанные данные')
  return 'PNG 1322×1958, JPEG 640×480 (пропуск APP0), мусор → null'
})

const runKey = (value, target = {}) => {
  const events = []
  const el = { ...baseEl(), ...target, dispatchEvent(event) { events.push(event); return true } }
  const context = {
    document: { querySelector: () => el, querySelectorAll: () => el.__focusables ?? [], activeElement: el, body: el },
    window: {},
    KeyboardEvent: class { constructor(type, init) { this.type = type; Object.assign(this, init); this.defaultPrevented = false } },
    Event: FakeEvent, MouseEvent: FakeEvent, InputEvent: FakeEvent, PointerEvent: FakeEvent,
  }
  const result = JSON.parse(vm.runInNewContext(scripts.actScript('press', '#k', value), context))
  return { result, events, el }
}
check('R21: ui_act press — комбинации клавиш', () => {
  const enter = runKey('')
  expect(enter.result.key === 'Enter' && enter.events[0].keyCode === 13, JSON.stringify(enter.result))
  const select = { selected: false, select() { this.selected = true } }
  const ctrlA = runKey('Ctrl+A', select)
  expect(ctrlA.events[0].ctrlKey === true && ctrlA.events[0].key === 'A' && ctrlA.events[0].code === 'KeyA', JSON.stringify(ctrlA.events[0]))
  expect(ctrlA.el.selected === true, 'Ctrl+A не выделил содержимое поля')
  const cmd = runKey('Cmd+Shift+Z')
  expect(cmd.events[0].metaKey === true && cmd.events[0].shiftKey === true && cmd.events[0].key === 'Z', JSON.stringify(cmd.events[0]))
  const arrow = runKey('down')
  expect(arrow.events[0].key === 'ArrowDown' && arrow.events[0].keyCode === 40, JSON.stringify(arrow.events[0]))
  const plus = runKey('Ctrl++')
  expect(plus.result.key === '+' && plus.events[0].ctrlKey === true, JSON.stringify(plus.result))
  const space = runKey('space')
  expect(space.events[0].key === ' ' && space.events[0].code === 'Space', JSON.stringify(space.events[0]))
  const digit = runKey('Alt+3')
  expect(digit.events[0].altKey === true && digit.events[0].code === 'Digit3', JSON.stringify(digit.events[0]))
  const tabbable = (name) => ({ name, getAttribute: () => null, disabled: false, getBoundingClientRect: () => ({ width: 5 }), focus() { this.focused = true } })
  const first = tabbable('a')
  const second = tabbable('b')
  const tab = runKey('Tab', { __focusables: [first, second] })
  expect(tab.events[0].key === 'Tab', 'Tab не отправлен')
  return 'Enter, Ctrl+A (select), Cmd+Shift+Z, ArrowDown, Ctrl++, Space, Alt+3, Tab'
})

const runPointer = (op, value, elements) => {
  const events = []
  const record = (node) => (event) => { events.push([node.name ?? '?', event.type]); return true }
  const mk = (name, rect, extra = {}) => ({ name, scrollIntoView() {}, getBoundingClientRect: () => rect, dispatchEvent: null, click() { events.push([name, 'click']) }, tagName: 'DIV', id: '', ...extra })
  const source = mk('source', { left: 0, top: 0, width: 20, height: 20 }, { draggable: elements.draggable })
  const target = mk('target', { left: 100, top: 100, width: 20, height: 20 })
  source.dispatchEvent = record(source)
  target.dispatchEvent = record(target)
  const byPoint = (x) => (x >= 90 ? target : source)
  const context = {
    document: { querySelector: (selector) => (selector === '#src' ? source : (selector === '#dst' ? target : null)), elementFromPoint: (x, y) => (elements.noHit ? null : byPoint(x)) },
    window: {},
    MouseEvent: FakeEvent, PointerEvent: FakeEvent,
    DragEvent: FakeEvent, DataTransfer: class {},
  }
  const result = JSON.parse(vm.runInNewContext(scripts.actScript(op, op === 'click_at' ? '' : '#src', value), context))
  return { result, events }
}
check('R22: ui_act — click_at и drag', () => {
  const hit = runPointer('click_at', '110,105', {})
  expect(hit.result.status === 'OK' && hit.events.some(([, type]) => type === 'click'), JSON.stringify(hit))
  expect(hit.events.some(([, type]) => type === 'mousedown'), 'click_at без mousedown')
  expect(runPointer('click_at', 'abc', {}).result.message.includes('x,y'), 'мусорные координаты')
  expect(runPointer('click_at', '5,5', { noHit: true }).result.message.includes('нет элемента'), 'вне окна')

  const toSelector = runPointer('drag', '#dst', {})
  expect(toSelector.result.status === 'OK' && toSelector.result.to[0] === 110 && toSelector.result.to[1] === 110, JSON.stringify(toSelector.result))
  const types = toSelector.events.map(([, type]) => type)
  expect(types[0] === 'pointerdown' || types[0] === 'mousedown', `порядок: ${types}`)
  expect(types.includes('mousemove') && types.includes('mouseup'), `нет move/up: ${types}`)
  const byDelta = runPointer('drag', '30,-5', {})
  expect(byDelta.result.to[0] === 40 && byDelta.result.to[1] === 5, JSON.stringify(byDelta.result))
  expect(runPointer('drag', '#nope', {}).result.message.includes('не найдена'), 'неизвестная цель')
  expect(runPointer('drag', '', {}).result.status === 'ERROR', 'drag без цели')
  const html5 = runPointer('drag', '#dst', { draggable: true }).events.map(([, type]) => type)
  expect(['dragstart', 'dragenter', 'dragover', 'drop', 'dragend'].every((name) => html5.includes(name)), `HTML5 drag: ${html5}`)
  return 'click_at, drag по селектору и смещению, HTML5-события для draggable'
})

check('R23: ui_read_page — корень и фильтр', () => {
  const nodes = [
    { tag: 'H1', text: 'Title', attrs: {} },
    { tag: 'BUTTON', text: 'Go', attrs: {} },
    { tag: 'A', text: 'Link', attrs: {} },
  ]
  const mkNode = (n) => ({ nodeType: 1, tagName: n.tag, textContent: n.text, disabled: false, className: '', id: '', parentElement: null,
    getAttribute: (name) => n.attrs[name] ?? null, getBoundingClientRect: () => ({ width: 10, height: 10 }) })
  const make = (rootSelector, filter) => {
    const els = nodes.map(mkNode)
    const context = {
      NodeFilter: { SHOW_ELEMENT: 1 },
      document: {
        body: { id: 'body' },
        querySelector: (selector) => (selector === '#panel' ? { id: 'panel' } : null),
        createTreeWalker: () => { let index = -1; return { get currentNode() { return { nodeType: 1, tagName: 'DIV', getAttribute: () => null } }, nextNode: () => { index += 1; return els[index] ?? null } } },
        getElementById: () => null,
      },
      window: { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }), CSS: { escape: (x) => x } },
      location: { href: 'https://x.test/' },
    }
    return JSON.parse(vm.runInNewContext(scripts.pageScanScript(50, rootSelector, filter), context))
  }
  const all = make('', 'all')
  expect(all.status === 'OK' && all.items.some((item) => item.role === 'heading'), JSON.stringify(all.items?.map((i) => i.role)))
  const interactive = make('', 'interactive')
  expect(interactive.items.every((item) => item.role !== 'heading') && interactive.items.length === 2, JSON.stringify(interactive.items?.map((i) => i.role)))
  const scoped = make('#panel', 'all')
  expect(scoped.status === 'OK', JSON.stringify(scoped))
  const missing = make('#nope', 'all')
  expect(missing.status === 'ERROR' && missing.message.includes('#nope'), JSON.stringify(missing))
  return 'heading только при filter=all; root найден/не найден'
})

check('R24: адресная строка — localhost, host:port и схемы', () => {
  const person = (raw) => rules.normalizeAddress(raw, { allowPrivate: true })
  expect(person('localhost:3000').url === 'http://localhost:3000/', `localhost:3000 → ${JSON.stringify(person('localhost:3000'))}`)
  expect(person('127.0.0.1:5173/app').url === 'http://127.0.0.1:5173/app', 'IP с портом')
  expect(person('192.168.1.5:8080').url === 'http://192.168.1.5:8080/', 'LAN-адрес')
  expect(person('http://localhost').ok === true, 'явный http://localhost')
  expect(person('example.com:8080').url === 'https://example.com:8080/', 'host:port → https')
  expect(person('ya.ru').url === 'https://ya.ru/', 'обычный адрес без схемы')
  for (const raw of ['file:///etc/hosts', 'javascript:alert(1)', 'data:text/html,x', 'about:blank', 'view-source:https://a.b', 'ftp://x.y', 'chrome://settings']) {
    expect(person(raw).ok === false, `${raw} принят для человека`)
  }
  // The agent keeps the SSRF guard, including bare localhost:port.
  expect(rules.normalizeAddress('localhost:3000').ok === false, 'агенту открыт localhost')
  expect(rules.normalizeAddress('http://192.168.1.5/').ok === false, 'агенту открыт LAN')
  expect(rules.normalizeAddress('example.com:8080').url === 'https://example.com:8080/', 'host:port агенту')
  return 'человек: localhost/LAN/host:port открываются; опасные схемы закрыты; агент по-прежнему не ходит во внутреннюю сеть'
})

check('R25: защита от внутренней сети — по хосту целиком', () => {
  expect(rules.normalizeAddress('http://10.example.com/').ok === true, '10.example.com — публичное имя, агенту можно')
  expect(rules.normalizeAddress('127.example.org').url === 'https://127.example.org/', '127.example.org → https')
  for (const raw of ['http://0.0.0.0/', 'http://[::1]/', 'http://169.254.169.254/latest', 'http://app.localhost/', 'http://10.1.2.3/', 'http://172.16.0.9/', 'http://127.0.0.1:8080/']) {
    expect(rules.normalizeAddress(raw).ok === false, `${raw} открыт агенту`)
  }
  expect(rules.normalizeAddress('http://172.32.0.1/').ok === true, '172.32.x — не приватный диапазон')
  expect(rules.normalizeAddress('user@host.test/path', { allowPrivate: true }).ok !== undefined, 'логин в адресе не ломает разбор')
  return 'метаданные облака 169.254, ::1, 0.0.0.0, *.localhost закрыты; 10.example.com открыт'
})

if (failed > 0) {
  console.log(`FAILED: ${failed}`)
  process.exit(1)
}
console.log('RULES OK: 25/25')
