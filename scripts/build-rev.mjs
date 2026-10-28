/**
 * Build fingerprint: a hash of every source file that affects the bundles.
 * Host embeds it (__BUILD_REV__) and `/health` reports it; scripts/live-check
 * recomputes the same value, so "running build == sources" is provable.
 */
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function collect(dir, files) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) collect(full, files)
    else files.push(full)
  }
}

/** @returns {string} short hex fingerprint of src/** and build inputs */
export function buildRev() {
  const files = []
  collect('src', files)
  files.push('build.mjs')
  files.push('package.json')
  files.sort()
  const hash = createHash('sha256')
  for (const file of files) {
    hash.update(file)
    hash.update(readFileSync(file))
  }
  return hash.digest('hex').slice(0, 12)
}
