/**
 * Coordinate forensics: under CDP device-metrics emulation (as the host
 * applies it), measure the screencast frame size and where Playwright mouse
 * events actually land in page CSS coordinates.
 */
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'

const deps = fileURLToPath(new URL('../.chromium-deps/usr/lib/x86_64-linux-gnu/', import.meta.url))
const context = await chromium.launchPersistentContext('/tmp/repro-coords-profile', {
  headless: true,
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  env: { ...process.env, LD_LIBRARY_PATH: `${deps}:${process.env.LD_LIBRARY_PATH ?? ''}` },
})
const page = context.pages()[0] ?? await context.newPage()
await page.goto("data:text/html,<body onclick='document.title=event.clientX+\",\"+event.clientY' style='margin:0;height:3000px'><h1>probe</h1></body>")

const emu = await page.context().newCDPSession(page)
await emu.send('Emulation.setDeviceMetricsOverride', { width: 470, height: 640, deviceScaleFactor: 1.5, mobile: false })
await page.waitForTimeout(300)

console.log('page innerWidth/Height/dpr:', await page.evaluate(() => `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}`))
console.log('playwright viewportSize():', page.viewportSize())

// screencast frame dimensions
const sc = await page.context().newCDPSession(page)
const frameDims = await new Promise((resolve) => {
  const timer = setTimeout(() => resolve(null), 2500)
  sc.on('Page.screencastFrame', (f) => {
    clearTimeout(timer)
    resolve({ data: Boolean(f.data), sessionId: f.sessionId })
    void sc.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
  })
  void sc.send('Page.startScreencast', { format: 'jpeg', quality: 80, maxWidth: 2560, maxHeight: 2560 }).catch(() => {})
})
console.log('screencast frame metadata:', frameDims)

// where does a Playwright click at (300,400) land in page coords?
await page.mouse.move(300, 400)
await page.mouse.click(300, 400)
await page.waitForTimeout(200)
console.log('playwright click(300,400) → page clientX,Y:', await page.title())

// and a click near the bottom-right of the emulated viewport (450, 620)
await page.mouse.click(450, 620)
await page.waitForTimeout(200)
console.log('playwright click(450,620) → page clientX,Y:', await page.title())

// CDP-native input dispatch through the emulation session for comparison
await emu.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 300, y: 400, button: 'left', clickCount: 1 })
await emu.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 300, y: 400, button: 'left', clickCount: 1 })
await page.waitForTimeout(200)
console.log('cdp click(300,400) → page clientX,Y:', await page.title())

await context.close()
