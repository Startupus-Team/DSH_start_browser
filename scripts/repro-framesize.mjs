// Capture one screencast frame under emulation and report its pixel size.
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'

const deps = fileURLToPath(new URL('../.chromium-deps/usr/lib/x86_64-linux-gnu/', import.meta.url))
const context = await chromium.launchPersistentContext('/tmp/repro-frames-profile', {
  headless: true,
  viewport: { width: 1280, height: 800 },
  env: { ...process.env, LD_LIBRARY_PATH: `${deps}:${process.env.LD_LIBRARY_PATH ?? ''}` },
})
const page = context.pages()[0] ?? await context.newPage()
await page.goto("data:text/html,<body style='margin:0;background:linear-gradient(#fff,#000);height:2000px'><h1>probe</h1></body>")

const emu = await page.context().newCDPSession(page)
await emu.send('Emulation.setDeviceMetricsOverride', { width: 470, height: 640, deviceScaleFactor: 1.5, mobile: false })
await page.waitForTimeout(300)

const sc = await page.context().newCDPSession(page)
const jpeg = await new Promise((resolve) => {
  const timer = setTimeout(() => resolve(null), 2500)
  sc.on('Page.screencastFrame', (f) => {
    clearTimeout(timer)
    resolve(f.data ?? null)
    void sc.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
  })
  void sc.send('Page.startScreencast', { format: 'jpeg', quality: 80, maxWidth: 2560, maxHeight: 2560 }).catch(() => {})
})

// Parse JPEG SOF for dimensions without dependencies.
function jpegSize(buf) {
  let off = 2
  while (off < buf.length) {
    if (buf[off] !== 0xff) { off += 1; continue }
    const marker = buf[off + 1]
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: (buf[off + 5] << 8) | buf[off + 6], width: (buf[off + 7] << 8) | buf[off + 8] }
    }
    const len = (buf[off + 2] << 8) | buf[off + 3]
    off += 2 + len
  }
  return null
}
console.log('emulated 470x640 @1.5 → frame pixels:', jpeg ? jpegSize(Buffer.from(jpeg, 'base64')) : 'no frame')
await context.close()
