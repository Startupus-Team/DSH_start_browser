#!/usr/bin/env node
/**
 * Build the plugin and produce market-ready artifacts:
 *   dist/startapus-browser-<version>.tgz   — npm tarball (what `npm publish` ships)
 *   dist/market-index.json                 — format-1 plugin market index with this version
 *
 * The index format is validated here against the same rules DSH's
 * `@deepseek-ai/dsh-plugin-market-index` enforces (format 1, exact SemVer,
 * Unix-seconds timestamp, npm|git source, declared category ids, relative icon).
 *
 * Usage: node scripts/market-pack.mjs [--publish-hint]
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const useGit = process.argv.includes('--git-source')
const gitRemote = 'https://github.com/Startupus-Team/DSH_start_browser'
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const version = String(pkg.version)
const SEMVER = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(?:\+[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?$/
const failures = []
const ok = (label, condition, detail = '') => {
  if (condition) console.log(`PASS  ${label}${detail === '' ? '' : ` — ${detail}`}`)
  else {
    failures.push(label)
    console.log(`FAIL  ${label}${detail === '' ? '' : ` — ${detail}`}`)
  }
}

console.log('== сборка ==')
execFileSync('node', ['build.mjs'], { stdio: 'inherit' })
ok('lib/index.js собран', existsSync('lib/index.js'))
ok('lib/client.js собран', existsSync('lib/client.js'))
const patchPath = pkg.dsh?.bundle?.patch ?? 'cordis.patch.yml'
ok('bundle-патч на месте', existsSync(patchPath))
// The loader resolves the inserted row by package name, so a renamed/scoped package
// needs a matching `name:` in the bundle patch.
const patchText = existsSync(patchPath) ? readFileSync(patchPath, 'utf8') : ''
ok('name в bundle-патче совпадает с пакетом', patchText.includes(`name: ${pkg.name}`), `ожидается "name: ${pkg.name}"`)
ok('иконка на месте', existsSync(pkg.icon ?? 'icon.svg'))

console.log('\n== npm tarball ==')
rmSync('dist', { recursive: true, force: true })
mkdirSync('dist', { recursive: true })
execFileSync('npm', ['pack', '--pack-destination', 'dist'], { stdio: 'inherit' })
const tarball = readdirSync('dist').find((name) => name.endsWith('.tgz'))
ok('tarball создан', typeof tarball === 'string', tarball ?? 'нет')
const bytes = Buffer.from(readFileSync(join('dist', tarball)))
const sha256 = createHash('sha256').update(bytes).digest('hex')
console.log(`  размер ${(bytes.length / 1024).toFixed(1)} КБ · sha256 ${sha256.slice(0, 16)}…`)

const listing = execFileSync('tar', ['-tzf', join('dist', tarball)], { encoding: 'utf8' }).trim().split('\n')
for (const required of ['package/lib/index.js', 'package/lib/client.js', 'package/cordis.patch.yml', 'package/package.json', 'package/icon.svg']) {
  ok(`tarball содержит ${required}`, listing.includes(required))
}

console.log('\n== market index (format 1) ==')
const publishTimestamp = Math.floor(Date.now() / 1000)
const index = {
  format: 1,
  title: { en: 'Startapus plugins', ru: 'Плагины Startapus' },
  description: {
    en: 'Bundles published for DSH by Startapus.',
    ru: 'Бандлы для DSH, опубликованные Startapus.',
  },
  metadata: {
    categories: { browser: { title: { en: 'Browser', ru: 'Браузер' } } },
  },
  plugins: [
    {
      name: pkg.name,
      title: { en: 'Startapus Browser', ru: 'Startapus Browser' },
      description: {
        en: 'A real webview browser tab in the DSH right sidebar with agent tools and an element picker.',
        ru: 'Настоящий браузер во правой панели DSH: агентские инструменты и пикер элементов.',
      },
      icon: pkg.icon ?? 'icon.svg',
      metadata: { category: 'browser', keywords: ['browser', 'webview', 'review', 'screenshot'] },
      versions: [
        {
          version,
          publishTimestamp,
          source: useGit
            ? {
                type: 'git',
                url: gitRemote,
                commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
              }
            : { type: 'npm' },
          engines: { dsh: '>=0.2.1-rc.3 <0.3.0' },
        },
      ],
    },
  ],
}

// Validation mirroring @deepseek-ai/dsh-plugin-market-index (format 1).
ok('format = 1', index.format === 1)
ok('title содержит en', typeof index.title === 'object' && typeof index.title.en === 'string' && index.title.en.trim() !== '')
const declaredCategories = new Set(Object.keys(index.metadata.categories))
const plugin = index.plugins[0]
ok('имя пакета валидно', /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/.test(plugin.name), plugin.name)
ok('категория объявлена', plugin.metadata.category === undefined || declaredCategories.has(plugin.metadata.category))
const entry = plugin.versions[0]
ok('точная SemVer', SEMVER.test(entry.version), entry.version)
ok('publishTimestamp — целые Unix-секунды', Number.isInteger(entry.publishTimestamp) && entry.publishTimestamp >= 0 && entry.publishTimestamp < 1e11)
ok('source.type = npm | git', entry.source.type === 'npm' || entry.source.type === 'git', entry.source.type)
if (entry.source.type === 'git') {
  ok('git-коммит — 40 hex', /^[0-9a-f]{40}$/.test(entry.source.commit), entry.source.commit.slice(0, 12))
  ok('git-url — HTTPS без query', /^https:\/\/[^?#]+$/.test(entry.source.url), entry.source.url)
}
const rangePart = /^(?:[~^]|>=|<=|>|<|=)?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
const isRange = (range) => range.trim().split(/\s+/).every((part) => part === '' || part === '*' || rangePart.test(part))
ok('engines.dsh — SemVer-диапазон', isRange(entry.engines.dsh), entry.engines.dsh)
ok('версии не дублируются и отсортированы', new Set(plugin.versions.map((row) => row.version)).size === plugin.versions.length)
ok('иконка относительная', !/^https?:/i.test(plugin.icon))

writeFileSync(join('dist', 'market-index.json'), JSON.stringify(index, null, 2) + '\n')
// Root copy is what users point Discover at (raw.githubusercontent URL).
writeFileSync('market-index.json', JSON.stringify(index, null, 2) + '\n')
console.log(`\nindex: dist/market-index.json · версия ${version} · ts ${publishTimestamp}`)

if (failures.length > 0) {
  console.log(`\nMARKET FAILED: ${failures.length}`)
  process.exit(1)
}
console.log('\nMARKET OK: артефакты готовы')
console.log('\nДальше (нужен твой npm-аккаунт и HTTPS-хостинг индекса):')
if (useGit) console.log(`  1. git push origin master                 # индекс ставит на коммит ${String(entry.source.commit).slice(0, 12)}`)
else console.log(`  1. npm publish --access public            # публикует ${pkg.name}@${version}`)
console.log('  2. положи dist/market-index.json на любой HTTPS URL (Pages, gist raw, свой сервер)')
console.log('  3. в DSH: Plugins → More → Experimental plugins → Custom plugin markets → Discover → добавить URL индекса')
