import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

// Host half: plain ESM. @deepseek-ai/* and playwright stay external — they
// resolve from this package's own node_modules at loader time.
await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  sourcemap: true,
  logLevel: 'info',
  external: ['playwright', 'playwright-core', '@deepseek-ai/*'],
})

// Client half: the loader's lazy-CJS factory format, byte-shape-matched to the
// shipped dsh client bundles:
//   window.__ModuleLoader__.load({ id, factory: (require) => { ... return module.exports } })
// react/react-dom are platform modules resolved through the factory's require.
await build({
  entryPoints: ['src/client/index.tsx'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  sourcemap: true,
  logLevel: 'info',
  external: [
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-dom/client',
    // platform module provided by the dsh web shell's module facade (same
    // mechanism as react — the icons ship inside the web frontend bundle)
    '@deepseek-ai/dsh-client-ui-primitives',
  ],
  banner: {
    js: [
      `window.__ModuleLoader__.load({`,
      `\tid: ${JSON.stringify(pkg.name)},`,
      `\tfactory: (require) => {`,
      `\t\tvar module = { exports: {} };`,
      `\t\tvar exports = module.exports;`,
      `\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });`,
    ].join('\n'),
  },
  footer: {
    js: '\n\t\treturn module.exports;\n\t}\n});',
  },
})

console.log('[dsh-plugin-browser] build done')
