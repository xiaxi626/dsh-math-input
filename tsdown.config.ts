import { defineConfig } from 'tsdown'
import { clientBundle } from './tsdown.client.ts'

const HOST_EXTERNALS = [
  '@deepseek-ai/cosmokit',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-typert-protocol',
  '@deepseek-ai/dsh-settings',
  '@deepseek-ai/schemastery'
] as const

export default defineConfig([
  {
    name: 'dsh-math-input',
    entry: {
      index: 'src/index.ts',
      typert: 'src/typert.ts',
      remote: 'src/remote.ts'
    },
    outDir: 'lib',
    format: 'esm',
    platform: 'node',
    target: 'es2022',
    dts: false,
    clean: true,
    sourcemap: true,
    outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
    deps: {
      neverBundle: [...HOST_EXTERNALS]
    }
  },
  clientBundle('dsh-math-input', 'src/client.ts')
])
