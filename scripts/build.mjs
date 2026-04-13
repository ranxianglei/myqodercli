import * as esbuild from 'esbuild'
import { chmodSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

esbuild.build({
  entryPoints: [join(__dirname, '../src/bin/cli.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: join(__dirname, '../dist/bin/cli.cjs'),
  banner: { js: '#!/usr/bin/env node' },
  external: ['node-pty'],
  minify: false,
  sourcemap: false,
}).then(() => {
  chmodSync(join(__dirname, '../dist/bin/cli.cjs'), 0o755)
  console.log('Build complete: dist/bin/cli.cjs')
})
