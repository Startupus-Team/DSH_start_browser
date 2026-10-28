/**
 * Build host + client + preload bundles.
 *
 * Host: ESM, node platform, packages external (cordis/dsh are peers).
 * Client: ESM, browser platform, React + dsh-ui packages external.
 *
 * @module startapus-browser/build
 */

import { build } from 'esbuild'

import { buildRev } from './scripts/build-rev.mjs'

const rev = buildRev()

const common = {
  define: { __BUILD_REV__: JSON.stringify(rev) },
  bundle: true,
  sourcemap: false,
  logLevel: 'info',
}

await build({
  ...common,
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  format: 'esm',
  platform: 'node',
  packages: 'external',
})

await build({
  ...common,
  entryPoints: ['src/client/index.tsx'],
  outfile: 'lib/client.js',
  format: 'cjs',
  platform: 'browser',
  jsx: 'automatic',
  external: ['react', 'react-dom', 'react/jsx-runtime', '@deepseek-ai/*'],
  banner: {
    js: [
      'window.__ModuleLoader__.load({',
      '  id: "startapus-browser",',
      '  factory: (require) => {',
      '    var module = { exports: {} };',
      '    var exports = module.exports;',
    ].join('\n'),
  },
  footer: {
    js: '    return module.exports;\n  }\n});',
  },
})

console.log(`startapus-browser: built lib/index.js, lib/client.js (rev ${rev})`)
