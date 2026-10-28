import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
const token = process.argv[2]
const deps = fileURLToPath(new URL('../.chromium-deps/usr/lib/x86_64-linux-gnu/', import.meta.url))
const browser = await chromium.launch({ headless: true, env: { ...process.env, LD_LIBRARY_PATH: `${deps}:${process.env.LD_LIBRARY_PATH ?? ''}` } })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
await page.goto(`http://127.0.0.1:3080/?token=${token}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)
const browse = page.getByRole('button', { name: '浏览器' }).first()
await browse.waitFor({ state: 'visible', timeout: 10000 })
const settings = page.getByRole('button', { name: '设置' }).first()
await settings.waitFor({ state: 'visible', timeout: 10000 })
const compare = await page.evaluate(([bSel, sSel]) => {
  const findBtn = (name) => [...document.querySelectorAll('button')].find((b) => {
    const label = b.getAttribute('aria-label') ?? b.textContent?.trim()
    return label === name
  })
  const b = findBtn(bSel)
  const s = findBtn(sSel)
  if (!b || !s) return { found: false }
  const rb = b.getBoundingClientRect()
  const rs = s.getBoundingClientRect()
  const cs = getComputedStyle(b)
  const csS = getComputedStyle(s)
  return {
    found: true,
    rect: { browser: { x: rb.x, y: rb.y, w: rb.width, h: rb.height }, settings: { x: rs.x, y: rs.y, w: rs.width, h: rs.height } },
    sameHeight: Math.abs(rb.height - rs.height) < 0.5,
    sameLeft: Math.abs((rb.x - parseFloat(getComputedStyle(b).paddingLeft)) - (rs.x - parseFloat(csS.paddingLeft))) < 1,
    fontSize: { browser: cs.fontSize, settings: csS.fontSize },
    lineHeight: { browser: cs.lineHeight, settings: csS.lineHeight },
    borderRadius: { browser: cs.borderRadius, settings: csS.borderRadius },
  }
}, ['浏览器', '设置'])
console.log(JSON.stringify(compare, null, 2))
const box = await browse.boundingBox()
await page.screenshot({ path: '/tmp/footer-compare.png', clip: { x: 0, y: Math.max(0, box.y - 70), width: 280, height: 170 } })
await browser.close()
