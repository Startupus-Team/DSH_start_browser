#!/usr/bin/env node
/**
 * DSH desktop cookie doctor (the real cause of the 28.10 harness crash).
 *
 * The desktop app stores a fresh `dsh-auth-*` cookie for 127.0.0.1 on every
 * launch and never removes the old ones. After ~70 launches the Cookie header
 * exceeds Node's 16 KB limit, the local host answers with an error and the app
 * shows "Web authentication failed" — a crash loop that looks like a plugin bug.
 *
 * This tool inspects the profile and, with `--apply`, deletes those cookies
 * after making a backup. QUIT THE APP before `--apply`.
 *
 * Usage:
 *   node scripts/dsh-cookie-doctor.mjs            # dry run: count + size
 *   node scripts/dsh-cookie-doctor.mjs --apply    # backup + delete
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const profile = join(homedir(), 'Library', 'Application Support', '@deepseek-ai', 'dsh-desktop')
const cookies = join(profile, 'Cookies')
const apply = process.argv.includes('--apply')

if (!existsSync(cookies)) {
  console.log(`FAIL  профиль DSH не найден: ${cookies}`)
  process.exit(1)
}

const sql = (statement) => execFileSync('sqlite3', [cookies, statement], { encoding: 'utf8' }).trim()

let count = '0'
let bytes = '0'
try {
  count = sql("select count(*) from cookies where name like 'dsh-auth-%';")
  bytes = sql("select coalesce(sum(length(name) + length(value) + 64), 0) from cookies where name like 'dsh-auth-%';")
} catch (error) {
  console.log(`FAIL  не удалось прочитать Cookies: ${String(error)}`)
  process.exit(1)
}

const headerBytes = (Number(count) * 80) + Number(bytes)
console.log(`cookie dsh-auth-*: ${count}`)
console.log(`примерный размер Cookie-заголовка: ${Math.round(headerBytes / 1024)} КБ (лимит Node ~16 КБ)`)

if (Number(count) === 0) {
  console.log('OK  чистить нечего')
  process.exit(0)
}
if (headerBytes < 12 * 1024) {
  console.log('OK  запас есть, чистка пока не обязательна')
  if (!apply) process.exit(0)
}

if (!apply) {
  console.log('DRY RUN: запустите с --apply, предварительно закрыв приложение (Cmd+Q)')
  process.exit(0)
}

const backup = `${cookies}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`
copyFileSync(cookies, backup)
console.log(`бэкап: ${backup}`)
sql("delete from cookies where name like 'dsh-auth-%;")
console.log(`удалено cookie dsh-auth-*: ${count}`)
console.log('готово — запустите приложение заново')
