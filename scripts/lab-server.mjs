#!/usr/bin/env node
/** Serve src/lab.ts fixtures on a fixed local port (no DSH restart needed). */
import { createServer } from 'node:http'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const port = Number(process.argv[2] ?? 55999)
const out = join(mkdtempSync(join(tmpdir(), 'startapus-lab-')), 'lab.mjs')
await build({ entryPoints: ['src/lab.ts'], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent' })
const lab = await import(pathToFileURL(out).href)
const send = (res, status, type, body) => { res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body) }

createServer((req, res) => {
  const path = new URL(req.url ?? '/', `http://127.0.0.1:${port}`).pathname
  if (path === '/lab' || path === '/lab/') return send(res, 200, 'text/html; charset=utf-8', lab.LAB_HTML)
  if (path === '/lab/other' || path === '/startapus-browser/lab/other') return send(res, 200, 'text/html; charset=utf-8', lab.LAB_OTHER_HTML)
  if (path.endsWith('/lab/data')) return send(res, 200, 'application/json; charset=utf-8', lab.LAB_DATA)
  if (path.endsWith('/lab/missing')) return send(res, 404, 'application/json; charset=utf-8', '{"ok":false}')
  send(res, 404, 'text/plain; charset=utf-8', 'not found')
}).listen(port, '127.0.0.1', () => console.log(`LAB server: http://127.0.0.1:${port}/lab`))
