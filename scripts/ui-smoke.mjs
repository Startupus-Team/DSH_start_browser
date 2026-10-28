/**
 * UI smoke test: boots the real dsh web client in headless Chromium and walks
 * the browser-panel reference-chip workflow — open tab, navigate, pick two
 * elements, expect 元素1/元素2 reference chips inserted into the composer
 * (no attachments), then type an instruction referencing them.
 * Run while `dsh web --patch …` is up:
 *   node scripts/ui-smoke.mjs <token>
 */
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'

const token = process.argv[2]
if (!token) {
  console.error('usage: node scripts/ui-smoke.mjs <token>')
  process.exit(1)
}

const deps = fileURLToPath(new URL('../.chromium-deps/usr/lib/x86_64-linux-gnu/', import.meta.url))
const browser = await chromium.launch({
  headless: true,
  env: { ...process.env, LD_LIBRARY_PATH: `${deps}:${process.env.LD_LIBRARY_PATH ?? ''}` },
})
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })

const errors = []
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  if (message.text().includes('[dsh-browser] wheel')) console.log('WHEELDEBUG:', message.text().slice(0, 260))
})

const fail = async (reason) => {
  console.error(`FAIL: ${reason}`)
  await page.screenshot({ path: '/tmp/ui-smoke-fail.png', fullPage: true }).catch(() => {})
  await browser.close()
  process.exit(1)
}

await page.goto(`http://127.0.0.1:3080/?token=${token}`, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
await page.waitForTimeout(3000)

// 1. The footer action button rendered (client plugin activated).
const footerButton = page.getByRole('button', { name: /浏览器/ }).first()
try {
  await footerButton.waitFor({ state: 'visible', timeout: 15000 })
} catch {
  await fail('footer 浏览器 button not found — client plugin may not have activated')
}
console.log('PASS: footer 浏览器 button rendered')

// 2. Open the browser tab.
await footerButton.click()
const canvas = page.locator('canvas').first()
try {
  await canvas.waitFor({ state: 'visible', timeout: 10000 })
} catch {
  await fail('browser tab body (canvas) did not mount')
}
console.log('PASS: browser tab opened with canvas')

// 3. Navigate through the panel URL bar.
const urlInput = page.getByPlaceholder('输入网址后回车')
await urlInput.fill("data:text/html,<title>PanelDemo</title><h1 style='margin-top:120px'>dsh panel demo</h1><button id='b1' style='font-size:28px;padding:16px;margin:8px'>PRESS ME</button><input id='i1' placeholder='search-here' style='font-size:22px;padding:12px;margin:8px'/><a href='#' style='font-size:24px;margin:8px;display:inline-block'>a link</a>")
await urlInput.press('Enter')
let sawTitle = false
for (let i = 0; i < 10; i += 1) {
  await page.waitForTimeout(1000)
  if ((await page.locator('text=PanelDemo').count()) > 0) {
    sawTitle = true
    break
  }
}
if (!sawTitle) await fail('panel status bar did not show navigated page title')
console.log('PASS: panel navigated and status bar shows page title')

// 3b. Wheel scrolling: a tall page whose title records window.scrollY.
// (Navigate via the cmd API — Playwright fill() appends instead of replacing
// on this controlled input when it shows the title display form.)
const tallUrl = "data:text/html,<body onscroll=\"document.title='scrolled:'+window.scrollY\" style='height:4000px;margin:0'><h1 style='position:fixed'>tall page</h1></body>"
await page.evaluate(async (url) => {
  await fetch('/dsh-browser/api/cmd', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'navigate', url }),
  })
}, tallUrl)
await page.waitForTimeout(1500)
// Hover the canvas first (virtual cursor), then dispatch a wheel event —
// synthetic AND a real trusted wheel (Playwright mouse.wheel).
await canvas.hover()
await page.waitForTimeout(200)
await page.locator('canvas').first().dispatchEvent('wheel', {
  deltaY: 600, deltaX: 0, deltaMode: 0, bubbles: true, cancelable: true,
})
const cbox = await canvas.boundingBox()
if (cbox) {
  await page.mouse.move(cbox.x + cbox.width / 2, cbox.y + cbox.height / 2)
  await page.mouse.wheel(0, 600)
}
let scrolled = false
for (let i = 0; i < 8; i += 1) {
  await page.waitForTimeout(500)
  const barText = await page.evaluate(() => {
    const spans = [...document.querySelectorAll('span')]
    return spans.map((s) => s.textContent ?? '').find((t) => t.includes('scrolled') || t.includes('tall') || t.includes('PanelDemo'))
  })
  console.log(`poll ${i}: status bar = ${JSON.stringify(barText)}`)
  if ((await page.locator('text=/scrolled:[1-9]/').count()) > 0) {
    scrolled = true
    break
  }
}
if (!scrolled) await fail('wheel event did not scroll the controlled page (status title has no scrollY)')
console.log('PASS: wheel scrolling reaches the controlled page')

// 3c. Coordinate precision: a marker page records where clicks land; a click
// at the canvas center must land at the canvas center in page coordinates.
const markerUrl = "<data:text/html,<body onclick='document.title=event.clientX+\",\"+event.clientY' style='margin:0'><h1>marker</h1></body>".slice(1)
await page.evaluate(async (url) => {
  await fetch('/dsh-browser/api/cmd', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'navigate', url }),
  })
}, markerUrl)
await page.waitForTimeout(1200)
const mbox = await canvas.boundingBox()
if (!mbox) await fail('canvas box unavailable for marker click')
await page.mouse.click(mbox.x + mbox.width / 2, mbox.y + mbox.height / 2)
let markerTitle = null
for (let i = 0; i < 8; i += 1) {
  await page.waitForTimeout(400)
  const t = await page.evaluate(() => {
    const spans = [...document.querySelectorAll('span')]
    const found = spans.map((s) => s.textContent ?? '').find((t) => /^\d+,\d+$/.test(t.trim()))
    return found ?? null
  })
  if (t) { markerTitle = t.trim(); break }
}
if (!markerTitle) await fail('marker page never recorded the click')
const [mx, my] = markerTitle.split(',').map(Number)
const expectX = Math.round(mbox.width / 2)
const expectY = Math.round(mbox.height / 2)
if (Math.abs(mx - expectX) > 2 || Math.abs(my - expectY) > 2) {
  await fail(`coordinate mismatch: click at canvas center should land near (${expectX},${expectY}), page saw (${mx},${my})`)
}
console.log(`PASS: click coordinates land on target (page saw ${mx},${my}, expected ≈${expectX},${expectY})`)

// 4. Pick mode on; pick two elements — each inserts a 元素N chip, no attachments.
await page.getByRole('button', { name: /选择元素/ }).click()
await page.waitForTimeout(600)
const canvasBox = await canvas.boundingBox()
if (!canvasBox) await fail('canvas bounding box unavailable')
await page.mouse.click(canvasBox.x + canvasBox.width * 0.5, canvasBox.y + canvasBox.height * 0.22)
await page.waitForTimeout(900)
await page.mouse.click(canvasBox.x + canvasBox.width * 0.5, canvasBox.y + canvasBox.height * 0.32)
await page.waitForTimeout(900)

const composer = page.locator('[contenteditable="true"]').first()
if (!(await composer.count())) await fail('composer editor not found')
const draftText = (await composer.textContent()) ?? ''
if (!draftText.includes('元素1') || !draftText.includes('元素2')) {
  const notice = await page.locator('div').filter({ hasText: /已插入输入框|插入失败/ }).first().textContent().catch(() => '')
  console.error('panel notice:', JSON.stringify(notice))
  console.error('draft text:', JSON.stringify(draftText.slice(0, 300)))
  await fail('composer draft missing 元素1/元素2 chips after picking')
}
const blobImgs = await page.locator('img[src^="blob:"]').count()
if (blobImgs !== 0) await fail(`expected no attachment previews on chip flow, found ${blobImgs}`)
console.log('PASS: picking inserted 元素1/元素2 chips (no attachments)')

// 5. Type an instruction referencing the chips.
await composer.click()
await page.keyboard.press('End')
await composer.type('把元素1和元素2调换位置')
await page.waitForTimeout(300)
const finalText = (await composer.textContent()) ?? ''
if (!finalText.includes('把元素1和元素2调换位置')) await fail('typed instruction missing from draft')
console.log('PASS: instruction referencing 元素1/元素2 typed into the draft')

// 6. Clearing the composer (the post-send state) restarts numbering at 元素1.
await composer.click()
await page.keyboard.press('ControlOrMeta+a')
await page.keyboard.press('Delete')
await page.waitForTimeout(500)
await page.mouse.click(canvasBox.x + canvasBox.width * 0.5, canvasBox.y + canvasBox.height * 0.42)
await page.waitForTimeout(900)
const afterClear = (await composer.textContent()) ?? ''
if (!afterClear.includes('元素1')) {
  console.error('draft after clear+pick:', JSON.stringify(afterClear.slice(0, 200)))
  await fail('numbering did not restart at 元素1 after the draft cleared')
}
console.log('PASS: numbering restarted at 元素1 after the composer emptied')

await page.screenshot({ path: '/tmp/ui-smoke-final.png', fullPage: true })
console.log('screenshot: /tmp/ui-smoke-final.png')

const relevant = errors.filter((e) => !/favicon|sourcemap|manifest/.test(e))
if (relevant.length > 0) {
  console.error(`console/page errors (${relevant.length}):`)
  for (const error of relevant.slice(0, 10)) console.error('  ' + error.slice(0, 300))
} else {
  console.log('PASS: no console/page errors')
}

await browser.close()
console.log('UI smoke done')
