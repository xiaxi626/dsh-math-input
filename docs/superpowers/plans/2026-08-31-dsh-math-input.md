# dsh-math-input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the dsh-math-input plugin from scratch: a zero-token DSH plugin providing handwriting math recognition, screenshot OCR, a LaTeX editor, and inline `\[...\]` rendering in the composer.

**Architecture:** Verified against `docs/ARCHITECTURE.md` (rewritten 2026-08-31 from first-party sources). Thin Host (settings-only `TypertRemoteService`, hand-written typert/remote contract), all recognition/UI Client-side via DSH slots (`conversation.input.left`, `conversation.input.dock`, `settings.section`) and React portals for modals. Composer writes only through `inputActions.setDraft`. Build = tsdown (Host ESM + `window.__ModuleLoader__`-wrapped Client CJS) + tsc declarations; `lib/` committed.

**Tech Stack:** TypeScript strict, React 18, tsdown, zod 4, schemastery, katex, ink-on + onnxruntime-web, node:test + tsx, ESLint 9, GitHub Actions (Node 20/22/24).

**Reference material (read these, not just this plan):**
- Spec: `docs/ARCHITECTURE.md` (this repo) — slot map, contract shapes, build pipeline, open questions.
- Pattern source: `C:\Users\asswsw\Downloads\dsh-better-input\src\` — mirror its structure verbatim where this plan says "mirror better-input".
- Official docs: `C:\Users\asswsw\Downloads\deepseek-harness\docs\subsystems\slots.md` and `typert.md`.

**Phasing:** Tasks 1–8 = Phase 1 (installable skeleton with settings page). Tasks 9–12 = Phase 2 (handwriting recognition end-to-end). Tasks 13–16 = Phase 3 (screenshot OCR, LaTeX editor, inline renderer, CI/docs). Each phase ends with an overlay-verification checkpoint.

**Environment note:** The workspace is not a git repository yet — Task 1 initializes it. All commands run in Git Bash from the project root (`C:\Users\asswsw\Downloads\dsh-math-input`).

---

### Task 1: Repository scaffold and toolchain

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `tsdown.config.ts`, `tsdown.client.ts`, `eslint.config.js`, `.gitignore`, `cordis.patch.yml`, `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CONTRIBUTING.zh-CN.md`, `src/index.ts`

- [ ] **Step 1: Initialize git**

```bash
git init
git add docs README.md README_CN.md THIRD_PARTY_NOTICES.md
git commit -m "docs: import architecture, readme, and third-party notices"
```

- [ ] **Step 2: Write package.json**

Resolve the current stable versions of the three runtime-recognition deps first:

```bash
npm view ink-on version
npm view onnxruntime-web version
npm view katex version
```

Create `package.json` substituting those exact versions for `<INK_ON>`, `<ORT_WEB>`, `<KATEX>`:

```json
{
  "name": "dsh-math-input",
  "version": "0.1.0",
  "description": "Zero-token offline math input for DeepSeek Harness: handwriting recognition, screenshot OCR, LaTeX editor, and inline LaTeX rendering.",
  "license": "MIT",
  "type": "module",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "exports": {
    ".": { "types": "./lib/index.d.ts", "default": "./lib/index.js" },
    "./client": { "types": "./lib/client.d.ts", "default": "./lib/client.js" },
    "./typert": { "types": "./lib/typert.d.ts", "default": "./lib/typert.js" },
    "./remote": { "types": "./lib/remote.d.ts", "default": "./lib/remote.js" },
    "./package.json": "./package.json"
  },
  "files": ["lib", "cordis.patch.yml", "README.md", "README_CN.md", "LICENSE"],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "inject": [
        "@deepseek-ai/dsh-client-runtime",
        "@deepseek-ai/dsh-client-ui-conversation",
        "@deepseek-ai/dsh-client-ui-slots"
      ]
    }
  },
  "scripts": {
    "build": "tsdown && tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test": "node --import tsx --test test/"
  },
  "peerDependencies": {
    "@deepseek-ai/cordis": "^4.0.1",
    "@deepseek-ai/dsh-client-runtime": ">=0.0.1-rc.1 <0.1.0 || >=0.1.0-rc.1 <0.2.0-0",
    "@deepseek-ai/dsh-client-ui-conversation": ">=0.0.1-rc.1 <0.1.0 || >=0.1.0-rc.1 <0.2.0-0",
    "@deepseek-ai/dsh-client-ui-slots": ">=0.0.1-rc.1 <0.1.0 || >=0.1.0-rc.1 <0.2.0-0",
    "@deepseek-ai/dsh-client-locale": ">=0.0.1-rc.1 <0.1.0 || >=0.1.0-rc.1 <0.2.0-0",
    "@deepseek-ai/dsh-api-remotes": ">=0.0.1-rc.1 <0.1.0 || >=0.1.0-rc.1 <0.2.0-0",
    "@deepseek-ai/dsh-settings": ">=0.0.1-rc.1 <0.1.0 || >=0.1.0-rc.1 <0.2.0-0",
    "@deepseek-ai/dsh-typert-protocol": ">=0.0.1-rc.1 <0.1.0 || >=0.1.0-rc.1 <0.2.0-0",
    "@deepseek-ai/schemastery": "^3.18.1",
    "zod": "^4.4.3"
  },
  "dependencies": {
    "ink-on": "^<INK_ON>",
    "katex": "^<KATEX>",
    "onnxruntime-web": "^<ORT_WEB>",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@deepseek-ai/cordis": "4.0.1",
    "@deepseek-ai/dsh-client-runtime": "0.1.0-rc.8",
    "@deepseek-ai/dsh-client-ui-conversation": "0.1.0-rc.8",
    "@deepseek-ai/dsh-client-ui-slots": "0.1.0-rc.8",
    "@deepseek-ai/dsh-client-ui-settings": "0.1.0-rc.8",
    "@deepseek-ai/dsh-client-locale": "0.1.0-rc.8",
    "@deepseek-ai/dsh-api-remotes": "0.1.0-rc.8",
    "@deepseek-ai/dsh-settings": "0.1.0-rc.8",
    "@deepseek-ai/dsh-typert-protocol": "0.1.0-rc.8",
    "@deepseek-ai/schemastery": "3.18.1",
    "@types/node": "^22.20.1",
    "@types/react": "~18.3.31",
    "@types/react-dom": "~18.3.7",
    "eslint": "^9.39.4",
    "react": "^18.3.1",
    "react-dom": "~18.3.1",
    "tsdown": "^0.22.14",
    "tsx": "^4.19.0",
    "typescript": "6.0.3",
    "typescript-eslint": "^8.67.0",
    "zod": "^4.4.3"
  },
  "engines": { "node": ">=20.0.0" }
}
```

- [ ] **Step 3: Write tsconfig.json and tsconfig.build.json**

`tsconfig.json` (mirrors better-input):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src", "test", "tsdown.config.ts", "tsdown.client.ts"]
}
```

`tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "emitDeclarationOnly": true,
    "declaration": true,
    "declarationDir": "lib",
    "outDir": "lib",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Write tsdown.config.ts and tsdown.client.ts**

`tsdown.client.ts` (copy of better-input's wrapper; the `window.__ModuleLoader__` contract):

```ts
import type { UserConfig } from 'tsdown'

const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-runtime/client',
  '@deepseek-ai/dsh-client-ui-conversation/client',
  '@deepseek-ai/dsh-client-ui-settings/client',
  '@deepseek-ai/dsh-client-ui-input-trigger/client',
  '@deepseek-ai/dsh-api-remotes/client'
] as const

export function clientBundle(id: string, entry: string): UserConfig {
  return {
    name: `${id}/client`,
    entry: { client: entry },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    dts: false,
    sourcemap: true,
    clean: false,
    deps: {
      neverBundle: [...CLIENT_EXTERNALS],
      alwaysBundle: (specifier: string) => (CLIENT_EXTERNALS.includes(specifier as typeof CLIENT_EXTERNALS[number]) ? undefined : true)
    },
    outputOptions: {
      entryFileNames: 'client.js',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
      footer: 'return module.exports; } });'
    }
  }
}
```

`tsdown.config.ts`:

```ts
import { defineConfig } from 'tsdown'
import { clientBundle } from './tsdown.client.ts'

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
    outExtensions: () => ({ js: '.js', dts: '.d.ts' })
  },
  clientBundle('dsh-math-input', 'src/client.ts')
])
```

- [ ] **Step 5: Write eslint.config.js, .gitignore, cordis.patch.yml**

`eslint.config.js`:

```js
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['lib/**', 'node_modules/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  }
)
```

Note: add `@eslint/js` to devDependencies (`npm i -D @eslint/js`).

`.gitignore`:

```
node_modules/
*.tsbuildinfo
.env
```

(Important: `lib/` is NOT ignored — it is committed, matching better-input/dsh-skills-nexus.)

`cordis.patch.yml`:

```yaml
# The dsh-math-input bundle patch. Browser behavior is discovered through the
# package's dsh.client manifest.
- insert:
    - id: dsh-math-input
      name: dsh-math-input
```

- [ ] **Step 6: Write LICENSE (MIT, Copyright 2026 dsh-math-input contributors), CHANGELOG.md (Keep a Changelog format, `0.1.0 - unreleased` entry), CONTRIBUTING.md / CONTRIBUTING.zh-CN.md (short: build/test commands + PR expectations, bilingual).**

- [ ] **Step 7: Write minimal src/index.ts so the build has a real entry**

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'dsh-math-input'

export function apply(_ctx: Context): void {
  // Settings service is mounted in Task 8.
}
```

Temporary `src/typert.ts` / `src/remote.ts` / `src/client.ts` placeholders so tsdown entries resolve:

`src/typert.ts`:
```ts
export const TYPERT = { package: 'dsh-math-input', face: 'host', schemas: [], invocations: [], model: { services: [], events: [], objects: [] } } as const
export default TYPERT
```

`src/remote.ts`:
```ts
export const TYPERT_REMOTE = { package: 'dsh-math-input', descriptors: [] } as const
export default TYPERT_REMOTE
```

`src/client.ts`:
```ts
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'

export const inject: string[] = []

export async function apply(_ctx: ClientContext): Promise<() => Promise<void>> {
  return async () => undefined
}
```

- [ ] **Step 8: Install and verify the toolchain**

```bash
npm install
npm run typecheck
npm run build
npm run lint
```

Expected: all three exit 0; `lib/` contains `index.js`, `typert.js`, `remote.js`, `client.js` (wrapped — check that `lib/client.js` starts with `window.__ModuleLoader__.load({ id: "dsh-math-input"`) and `.d.ts` files.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.build.json tsdown.config.ts tsdown.client.ts eslint.config.js .gitignore cordis.patch.yml LICENSE CHANGELOG.md CONTRIBUTING.md CONTRIBUTING.zh-CN.md src/ lib/
git commit -m "chore: scaffold plugin package with tsdown build pipeline"
```

---

### Task 2: Settings domain model (`src/config.ts`)

**Files:**
- Create: `src/config.ts`
- Test: `test/config.test.ts`

- [ ] **Step 1: Write the failing test**

`test/config.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_SETTINGS, validateSettings, effectiveDebounceMs, type MathInputSettings } from '../src/config.js'

test('defaults are complete and frozen', () => {
  assert.equal(DEFAULT_SETTINGS.recognitionMode, 'auto')
  assert.equal(DEFAULT_SETTINGS.beamWidth, 3)
  assert.equal(DEFAULT_SETTINGS.executionProvider, 'wasm')
  assert.equal(DEFAULT_SETTINGS.strokeDebounceSeconds, 1.5)
  assert.equal(DEFAULT_SETTINGS.language, '')
  assert.ok(Object.isFrozen(DEFAULT_SETTINGS))
})

test('validateSettings accepts defaults', () => {
  validateSettings(DEFAULT_SETTINGS)
})

test('validateSettings rejects bad beam width', () => {
  const bad: MathInputSettings = { ...DEFAULT_SETTINGS, beamWidth: 4 }
  assert.throws(() => validateSettings(bad), /beam width/i)
})

test('validateSettings rejects bad debounce', () => {
  const bad: MathInputSettings = { ...DEFAULT_SETTINGS, strokeDebounceSeconds: 0 }
  assert.throws(() => validateSettings(bad), /debounce/i)
})

test('validateSettings rejects unknown mode and provider', () => {
  assert.throws(() => validateSettings({ ...DEFAULT_SETTINGS, recognitionMode: 'kanji' as never }), /recognition mode/i)
  assert.throws(() => validateSettings({ ...DEFAULT_SETTINGS, executionProvider: 'cuda' as never }), /execution provider/i)
})

test('effectiveDebounceMs converts with fallback', () => {
  assert.equal(effectiveDebounceMs({ strokeDebounceSeconds: 1.5 }), 1500)
  assert.equal(effectiveDebounceMs({ strokeDebounceSeconds: -1 }), 1500)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../src/config.js'`.

- [ ] **Step 3: Implement src/config.ts**

```ts
export type RecognitionMode = 'auto' | 'number' | 'expression'
export type ExecutionProvider = 'wasm' | 'webgpu'

export interface MathInputSettings {
  /** Vocabulary masking: auto (all), number (digits/operators), expression (math symbols). */
  recognitionMode: RecognitionMode
  /** Beam search width: 1 (greedy) | 2 | 3 (best quality). */
  beamWidth: number
  /** ONNX execution provider. */
  executionProvider: ExecutionProvider
  /** Seconds of pen idle before auto-recognition. */
  strokeDebounceSeconds: number
  /** UI language override; empty follows the DSH locale. */
  language: string
}

export type MathInputSettingsPatch = Partial<MathInputSettings>

export interface MathInputSettingsView {
  available: boolean
  writable: boolean
  settings: MathInputSettings
  overridden: string[]
}

export const DEFAULT_SETTINGS: MathInputSettings = Object.freeze({
  recognitionMode: 'auto',
  beamWidth: 3,
  executionProvider: 'wasm',
  strokeDebounceSeconds: 1.5,
  language: '',
})

const RECOGNITION_MODES: readonly RecognitionMode[] = ['auto', 'number', 'expression']
const EXECUTION_PROVIDERS: readonly ExecutionProvider[] = ['wasm', 'webgpu']
export const DEFAULT_DEBOUNCE_SECONDS = 1.5

export function isValidBeamWidth(value: number): boolean {
  return value === 1 || value === 2 || value === 3
}

export function isValidDebounceSeconds(value: number): boolean {
  return Number.isFinite(value) && value >= 0.3 && value <= 10
}

export function validateSettings(settings: MathInputSettings): void {
  if (!RECOGNITION_MODES.includes(settings.recognitionMode)) {
    throw new Error('dsh-math-input recognition mode must be auto, number, or expression')
  }
  if (!isValidBeamWidth(settings.beamWidth)) {
    throw new Error('dsh-math-input beam width must be 1, 2, or 3')
  }
  if (!EXECUTION_PROVIDERS.includes(settings.executionProvider)) {
    throw new Error('dsh-math-input execution provider must be wasm or webgpu')
  }
  if (!isValidDebounceSeconds(settings.strokeDebounceSeconds)) {
    throw new Error('dsh-math-input stroke debounce must be between 0.3 and 10 seconds')
  }
}

export function effectiveDebounceMs(settings: Pick<MathInputSettings, 'strokeDebounceSeconds'>): number {
  const seconds = isValidDebounceSeconds(settings.strokeDebounceSeconds)
    ? settings.strokeDebounceSeconds
    : DEFAULT_DEBOUNCE_SECONDS
  return Math.round(seconds * 1000)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/config.ts test/config.test.ts
git commit -m "feat: settings domain model with validation"
```

---

### Task 3: LaTeX block detection (`src/latex/render.ts`, part 1)

**Files:**
- Create: `src/latex/render.ts`
- Test: `test/latex-detect.test.ts`

- [ ] **Step 1: Write the failing test**

`test/latex-detect.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { detectMathBlocks } from '../src/latex/render.js'

test('detects one closed display block', () => {
  const blocks = detectMathBlocks('energy: \\[E=mc^2\\] done')
  assert.equal(blocks.length, 1)
  const b = blocks[0]
  assert.ok(b)
  assert.equal(b.closed, true)
  assert.equal(b.latex, 'E=mc^2')
  assert.equal(b.delimiter, '\\[')
  assert.equal('energy: \\[E=mc^2\\] done'.slice(b.start, b.end), '\\[E=mc^2\\]')
})

test('unclosed \\[ stays plain (no block emitted as closed)', () => {
  const blocks = detectMathBlocks('start \\[x+1')
  assert.equal(blocks.filter((b) => b.closed).length, 0)
})

test('detects $$ pairs for pasted content', () => {
  const blocks = detectMathBlocks('a $$x^2$$ b')
  assert.equal(blocks.length, 1)
  assert.equal(blocks[0]?.delimiter, '$$')
  assert.equal(blocks[0]?.latex, 'x^2')
})

test('multiple blocks, order preserved', () => {
  const blocks = detectMathBlocks('\\[a\\] mid \\[b\\]')
  assert.deepEqual(blocks.map((b) => b.latex), ['a', 'b'])
})

test('escaped delimiters are not opens', () => {
  const blocks = detectMathBlocks('price \\\\[not-a-block')
  assert.equal(blocks.filter((b) => b.closed).length, 0)
})

test('empty latex between delimiters still counts as closed', () => {
  const blocks = detectMathBlocks('\\[\\]')
  assert.equal(blocks.length, 1)
  assert.equal(blocks[0]?.closed, true)
  assert.equal(blocks[0]?.latex, '')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../src/latex/render.js'`.

- [ ] **Step 3: Implement detection in src/latex/render.ts**

```ts
export type MathDelimiter = '\\[' | '$$'

export interface MathBlock {
  /** Offset of the opening delimiter in the source text. */
  start: number
  /** Offset just past the closing delimiter (or end of text when unclosed). */
  end: number
  /** Raw LaTeX between the delimiters. */
  latex: string
  delimiter: MathDelimiter
  closed: boolean
}

function isOpenAt(text: string, index: number, token: string): boolean {
  if (text.startsWith(token, index) === false) return false
  // An odd number of backslashes immediately before an opening token escapes it.
  let backslashes = 0
  let cursor = index - 1
  while (cursor >= 0 && text[cursor] === '\\') {
    backslashes += 1
    cursor -= 1
  }
  return backslashes % 2 === 0
}

export function detectMathBlocks(text: string): MathBlock[] {
  const blocks: MathBlock[] = []
  const delimiters: readonly { open: MathDelimiter; close: string }[] = [
    { open: '\\[', close: '\\]' },
    { open: '$$', close: '$$' },
  ]
  let index = 0
  while (index < text.length) {
    let matched = false
    for (const { open, close } of delimiters) {
      if (isOpenAt(text, index, open)) {
        const contentStart = index + open.length
        const closeIndex = findClosing(text, contentStart, close)
        if (closeIndex === -1) {
          index = contentStart
        } else {
          blocks.push({
            start: index,
            end: closeIndex + close.length,
            latex: text.slice(contentStart, closeIndex),
            delimiter: open,
            closed: true,
          })
          index = closeIndex + close.length
        }
        matched = true
        break
      }
      matched = false
    }
    if (matched === false) index += 1
  }
  return blocks
}

function findClosing(text: string, from: number, close: string): number {
  let cursor = from
  while (cursor < text.length) {
    const found = text.indexOf(close, cursor)
    if (found === -1) return -1
    if (isOpenAt(text, found, close) || close !== '\\]') return found
    cursor = found + close.length
  }
  return -1
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS (all latex-detect tests green).

- [ ] **Step 5: Commit**

```bash
git add src/latex/render.ts test/latex-detect.test.ts
git commit -m "feat: detect closed LaTeX display blocks in composer draft"
```

---

### Task 4: KaTeX render + LaTeX repair (`src/latex/render.ts` part 2, `src/latex/repair.ts`)

**Files:**
- Modify: `src/latex/render.ts` (add `renderLatex`)
- Create: `src/latex/repair.ts`
- Test: `test/latex-repair.test.ts`

- [ ] **Step 1: Write the failing test**

`test/latex-repair.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { repairLatex, isValidLatex } from '../src/latex/repair.js'

test('valid latex passes through unchanged', () => {
  assert.equal(repairLatex('\\frac{a}{b}'), '\\frac{a}{b}')
})

test('balances missing closing braces', () => {
  assert.equal(repairLatex('\\frac{a}{b'), '\\frac{a}{b}')
})

test('drops stray closing braces', () => {
  assert.equal(repairLatex('x^2}}'), 'x^2')
})

test('completes truncated \\frac', () => {
  const repaired = repairLatex('\\frac{1}')
  assert.ok(isValidLatex(repaired), `expected valid latex, got ${repaired}`)
})

test('completes truncated \\sqrt', () => {
  const repaired = repairLatex('\\sqrt')
  assert.ok(isValidLatex(repaired), `expected valid latex, got ${repaired}`)
})

test('garbage that cannot be repaired is returned as-is', () => {
  assert.equal(repairLatex('???'), '???')
})

test('isValidLatex rejects empty and unbalanced', () => {
  assert.equal(isValidLatex(''), false)
  assert.equal(isValidLatex('\\frac{a}{'), false)
  assert.equal(isValidLatex('a+b'), true)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../src/latex/repair.js'`.

- [ ] **Step 3: Implement src/latex/repair.ts**

```ts
import katex from 'katex'

export function isValidLatex(latex: string): boolean {
  if (latex.trim() === '') return false
  try {
    katex.renderToString(latex, { throwOnError: true, output: 'mathml' })
    return true
  } catch {
    return false
  }
}

const ARITY_COMMANDS: ReadonlyMap<string, number> = new Map([
  ['\\frac', 2],
  ['\\sqrt', 1],
  ['\\sum', 0],
  ['\\int', 0],
])

export function repairLatex(latex: string): string {
  const candidates = [
    latex,
    balanceBraces(latex),
    ...completeArityCommands(balanceBraces(latex)),
  ]
  for (const candidate of candidates) {
    if (isValidLatex(candidate)) return candidate
  }
  return latex
}

export function balanceBraces(latex: string): string {
  let depth = 0
  let kept = ''
  for (const char of latex) {
    if (char === '{') {
      depth += 1
      kept += char
      continue
    }
    if (char === '}') {
      if (depth === 0) continue
      depth -= 1
      kept += char
      continue
    }
    kept += char
  }
  return kept + '}'.repeat(depth)
}

function completeArityCommands(latex: string): string[] {
  const results: string[] = []
  const pattern = /\\(frac|sqrt)\b/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(latex)) !== null) {
    const command = match[0]
    const arity = ARITY_COMMANDS.get(command) ?? 0
    const groups = countTrailingGroups(latex.slice(match.index))
    if (groups < arity) {
      const filled = latex + '{}'.repeat(arity - groups) + (groups === 0 ? '{x}' : '')
      results.push(balanceBraces(filled))
    }
  }
  return results
}

function countTrailingGroups(fragment: string): number {
  let count = 0
  let index = fragment.indexOf('{')
  while (index !== -1) {
    count += 1
    index = fragment.indexOf('{', index + 1)
  }
  return count
}
```

- [ ] **Step 4: Add renderLatex to src/latex/render.ts**

Append:

```ts
import katex from 'katex'

/** Render one LaTeX string into an element; returns false when unrenderable. */
export function renderLatex(latex: string, element: HTMLElement): boolean {
  try {
    katex.render(latex, element, { throwOnError: false, displayMode: true })
    return true
  } catch {
    element.textContent = latex
    return false
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/latex/ test/latex-repair.test.ts
git commit -m "feat: KaTeX rendering and LaTeX auto-repair"
```

---

### Task 5: Stroke model + noise filter (`src/recognition/preprocess.ts`)

**Files:**
- Create: `src/recognition/preprocess.ts`
- Test: `test/preprocess.test.ts`

ink-on owns tensor construction (`preprocessStrokes`); our file holds the framework-agnostic stroke types and the pure noise filter so UI code never imports ink-on directly.

- [ ] **Step 1: Write the failing test**

`test/preprocess.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { isStrokeMeaningful, strokeBounds, type Stroke } from '../src/recognition/preprocess.js'

const dot: Stroke[] = [{ points: [{ x: 5, y: 5 }] }]
const tiny: Stroke[] = [{ points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }]
const real: Stroke[] = [{ points: [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 40 }] }]

test('single accidental tap is not meaningful', () => {
  assert.equal(isStrokeMeaningful(dot), false)
})

test('sub-pixel scribble is not meaningful', () => {
  assert.equal(isStrokeMeaningful(tiny), false)
})

test('an actual stroke is meaningful', () => {
  assert.equal(isStrokeMeaningful(real), true)
})

test('empty stroke list is not meaningful', () => {
  assert.equal(isStrokeMeaningful([]), false)
})

test('bounds cover all strokes', () => {
  const b = strokeBounds([real, { points: [{ x: -5, y: 60 }] }])
  assert.ok(b)
  assert.equal(b.minX, -5)
  assert.equal(b.maxY, 60)
  assert.equal(b.width, 35)
  assert.equal(b.height, 60)
})

test('bounds of empty input is undefined', () => {
  assert.equal(strokeBounds([]), undefined)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement src/recognition/preprocess.ts**

```ts
export interface StrokePoint {
  x: number
  y: number
}

export interface Stroke {
  points: StrokePoint[]
}

export interface StrokeBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

const MIN_MEANINGFUL_EXTENT = 4
const MIN_MEANINGFUL_POINTS = 2

export function strokeBounds(strokes: readonly Stroke[]): StrokeBounds | undefined {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let sawPoint = false
  for (const stroke of strokes) {
    for (const point of stroke.points) {
      sawPoint = true
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }
  }
  if (sawPoint === false) return undefined
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

export function isStrokeMeaningful(strokes: readonly Stroke[]): boolean {
  const totalPoints = strokes.reduce((sum, stroke) => sum + stroke.points.length, 0)
  if (totalPoints < MIN_MEANINGFUL_POINTS) return false
  const bounds = strokeBounds(strokes)
  if (bounds === undefined) return false
  return bounds.width >= MIN_MEANINGFUL_EXTENT || bounds.height >= MIN_MEANINGFUL_EXTENT
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/recognition/preprocess.ts test/preprocess.test.ts
git commit -m "feat: stroke model, bounds, and noise filter"
```

---

### Task 6: Image preprocessing (`src/recognition/image-preprocess.ts`)

**Files:**
- Create: `src/recognition/image-preprocess.ts`
- Test: `test/image-preprocess.test.ts`

Pure numeric pipeline (grayscale → invert → scale to height 256 → 64-aligned padding) operating on ImageData-shaped input so it is unit-testable without a canvas.

- [ ] **Step 1: Write the failing test**

`test/image-preprocess.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { toGrayscaleFloat, invert, scaleToHeight, padToMultiple, imageToTensor, TARGET_HEIGHT, ALIGNMENT } from '../src/recognition/image-preprocess.js'

function whiteImage(width: number, height: number): { width: number; height: number; data: Uint8ClampedArray } {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = 255
    data[i * 4 + 1] = 255
    data[i * 4 + 2] = 255
    data[i * 4 + 3] = 255
  }
  return { width, height, data }
}

test('grayscale luminance uses standard weights', () => {
  const img = { width: 1, height: 1, data: new Uint8ClampedArray([255, 0, 0, 255]) }
  const gray = toGrayscaleFloat(img)
  assert.ok(Math.abs(gray[0]! - 0.2126) < 0.01)
})

test('invert maps 0 -> 1 and 1 -> 0', () => {
  const values = new Float32Array([0, 1, 0.25])
  const out = invert(values)
  assert.deepEqual(Array.from(out), [1, 0, 0.75])
})

test('scaleToHeight produces target height and proportional width', () => {
  const scaled = scaleToHeight(new Float32Array(128 * 64).fill(0.5), 128, 64, TARGET_HEIGHT)
  assert.equal(scaled.height, TARGET_HEIGHT)
  assert.equal(scaled.width, 512)
  assert.equal(scaled.values.length, 512 * TARGET_HEIGHT)
  assert.ok(Math.abs(scaled.values[0]! - 0.5) < 0.01)
})

test('padToMultiple pads right/bottom with zeros to 64-alignment', () => {
  const padded = padToMultiple(new Float32Array(100 * 256).fill(1), 100, 256, ALIGNMENT)
  assert.equal(padded.width % ALIGNMENT, 0)
  assert.equal(padded.width, 128)
  assert.equal(padded.values[padded.width * 256 + 100], 0)
  assert.equal(padded.values[0], 1)
})

test('imageToTensor returns white-on-black 1xHxW Float32Array', () => {
  const tensor = imageToTensor(whiteImage(128, 64))
  assert.equal(tensor.height, TARGET_HEIGHT)
  assert.equal(tensor.width % ALIGNMENT, 0)
  // white ink on black background: original white pixels become 1 after invert.
  assert.equal(tensor.values[0], 1)
  // padded corner stays 0.
  assert.equal(tensor.values[tensor.values.length - 1], 0)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement src/recognition/image-preprocess.ts**

```ts
export const TARGET_HEIGHT = 256
export const ALIGNMENT = 64

export interface ImageLike {
  width: number
  height: number
  data: Uint8ClampedArray
}

export interface GrayImage {
  width: number
  height: number
  values: Float32Array
}

export function toGrayscaleFloat(image: ImageLike): Float32Array {
  const values = new Float32Array(image.width * image.height)
  for (let index = 0; index < values.length; index += 1) {
    const r = image.data[index * 4] ?? 0
    const g = image.data[index * 4 + 1] ?? 0
    const b = image.data[index * 4 + 2] ?? 0
    values[index] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  }
  return values
}

export function invert(values: Float32Array): Float32Array {
  const out = new Float32Array(values.length)
  for (let index = 0; index < values.length; index += 1) {
    out[index] = 1 - (values[index] ?? 0)
  }
  return out
}

export function scaleToHeight(values: Float32Array, width: number, height: number, targetHeight: number): GrayImage {
  const targetWidth = Math.max(1, Math.round((width / height) * targetHeight))
  const out = new Float32Array(targetWidth * targetHeight)
  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(height - 1, (y / targetHeight) * height)
    const y0 = Math.floor(sourceY)
    const y1 = Math.min(height - 1, y0 + 1)
    const yMix = sourceY - y0
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(width - 1, (x / targetWidth) * width)
      const x0 = Math.floor(sourceX)
      const x1 = Math.min(width - 1, x0 + 1)
      const xMix = sourceX - x0
      const top = (values[y0 * width + x0] ?? 0) * (1 - xMix) + (values[y0 * width + x1] ?? 0) * xMix
      const bottom = (values[y1 * width + x0] ?? 0) * (1 - xMix) + (values[y1 * width + x1] ?? 0) * xMix
      out[y * targetWidth + x] = top * (1 - yMix) + bottom * yMix
    }
  }
  return { width: targetWidth, height: targetHeight, values: out }
}

export function padToMultiple(values: Float32Array, width: number, height: number, multiple: number): GrayImage {
  const paddedWidth = Math.ceil(width / multiple) * multiple
  const paddedHeight = Math.ceil(height / multiple) * multiple
  if (paddedWidth === width && paddedHeight === height) {
    return { width, height, values }
  }
  const out = new Float32Array(paddedWidth * paddedHeight)
  for (let y = 0; y < height; y += 1) {
    out.set(values.subarray(y * width, (y + 1) * width), y * paddedWidth)
  }
  return { width: paddedWidth, height: paddedHeight, values: out }
}

/** Screenshot/pasted image -> CoMER encoder input (white ink on black, 256h, 64-aligned). */
export function imageToTensor(image: ImageLike): GrayImage {
  const gray = toGrayscaleFloat(image)
  const inked = invert(gray)
  const scaled = scaleToHeight(inked, image.width, image.height, TARGET_HEIGHT)
  return padToMultiple(scaled.values, scaled.width, scaled.height, ALIGNMENT)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/recognition/image-preprocess.ts test/image-preprocess.test.ts
git commit -m "feat: screenshot image-to-tensor preprocessing pipeline"
```

---

### Task 7: Typert / Remote contract trio

**Files:**
- Modify (replace placeholders): `src/remote-contract.ts` (create), `src/typert.ts`, `src/remote.ts`
- Test: `test/contract.test.ts`

Mirror `dsh-better-input/src/{remote-contract,typert,remote}.ts` exactly, with our two settings invocations.

- [ ] **Step 1: Write the failing test**

`test/contract.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import TYPERT from '../src/typert.js'
import TYPERT_REMOTE from '../src/remote.js'
import { mathInputSettingsSchema, mathInputSettingsPatchSchema, mathInputSettingsViewSchema } from '../src/remote-contract.js'

test('typert manifest declares both settings invocations', () => {
  const ids = TYPERT.invocations.map((invocation) => invocation.id)
  assert.deepEqual(ids, ['dsh-math-input#mathInput/getSettings', 'dsh-math-input#mathInput/updateSettings'])
  assert.equal(TYPERT.package, 'dsh-math-input')
  assert.equal(TYPERT.face, 'host')
})

test('remote descriptors mirror the typert manifest', () => {
  assert.deepEqual(
    TYPERT_REMOTE.descriptors.map((descriptor) => descriptor.id),
    TYPERT.invocations.map((invocation) => invocation.id),
  )
  assert.equal(TYPERT_REMOTE.package, 'dsh-math-input')
})

test('updateSettings parameter and cancellation are declared', () => {
  const update = TYPERT.invocations[1]
  assert.ok(update)
  assert.equal(update.parameters.length, 1)
  assert.equal(update.parameters[0]?.wire, 'patch')
  assert.deepEqual(update.cancellation, { parameter: 'signal' })
})

test('wire schemas accept defaults and reject junk', () => {
  const settings = { recognitionMode: 'auto', beamWidth: 3, executionProvider: 'wasm', strokeDebounceSeconds: 1.5, language: '' }
  assert.deepEqual(mathInputSettingsSchema.parse(settings), settings)
  assert.deepEqual(mathInputSettingsPatchSchema.parse({ beamWidth: 1 }), { beamWidth: 1 })
  assert.ok(mathInputSettingsViewSchema.parse({ available: true, writable: true, settings, overridden: [] }))
  assert.throws(() => mathInputSettingsSchema.parse({ beamWidth: 'three' }))
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../src/remote-contract.js'` and manifest shape mismatches.

- [ ] **Step 3: Implement src/remote-contract.ts**

```ts
import { z } from 'zod'
import type { MathInputSettings, MathInputSettingsPatch, MathInputSettingsView } from './config.js'

export const textSchema = z.string()

export const mathInputSettingsSchema = z.object({
  recognitionMode: z.enum(['auto', 'number', 'expression']),
  beamWidth: z.number(),
  executionProvider: z.enum(['wasm', 'webgpu']),
  strokeDebounceSeconds: z.number(),
  language: z.string(),
})

export const mathInputSettingsPatchSchema = z.object({
  recognitionMode: z.enum(['auto', 'number', 'expression']).optional(),
  beamWidth: z.number().optional(),
  executionProvider: z.enum(['wasm', 'webgpu']).optional(),
  strokeDebounceSeconds: z.number().optional(),
  language: z.string().optional(),
})

export const mathInputSettingsViewSchema = z.object({
  available: z.boolean(),
  writable: z.boolean(),
  settings: mathInputSettingsSchema,
  overridden: z.array(z.string()),
})

export type MathInputSettingsWire = z.infer<typeof mathInputSettingsSchema>
export type MathInputSettingsPatchWire = z.infer<typeof mathInputSettingsPatchSchema>
export type MathInputSettingsViewWire = z.infer<typeof mathInputSettingsViewSchema>
export type { MathInputSettings, MathInputSettingsPatch, MathInputSettingsView }
```

- [ ] **Step 4: Implement src/typert.ts (replaces placeholder)**

```ts
import { mathInputSettingsPatchSchema, mathInputSettingsViewSchema } from './remote-contract.js'

export const TYPERT = {
  package: 'dsh-math-input',
  face: 'host',
  schemas: [],
  invocations: [
    {
      id: 'dsh-math-input#mathInput/getSettings',
      service: 'MathInput',
      namespace: 'mathInput',
      method: 'getSettings',
      invocation: { kind: 'direct' },
      parameters: [],
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-math-input#MathInputSettingsView',
        schema: mathInputSettingsViewSchema,
      },
    },
    {
      id: 'dsh-math-input#mathInput/updateSettings',
      service: 'MathInput',
      namespace: 'mathInput',
      method: 'updateSettings',
      invocation: { kind: 'direct' },
      parameters: [{
        name: 'patch',
        wire: 'patch',
        source: 'json',
        codec: { mode: 'strict', typeSymbol: 'dsh-math-input#MathInputSettingsPatch', schema: mathInputSettingsPatchSchema },
      }],
      cancellation: { parameter: 'signal' },
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-math-input#MathInputSettingsView',
        schema: mathInputSettingsViewSchema,
      },
    },
  ],
  model: {
    services: [
      {
        description: 'Host-side settings persistence for the math input plugin.',
        summary: 'Math input settings service.',
        tags: [],
        jsDoc: '/** Host-side settings persistence for the math input plugin. */',
        key: 'MathInput',
        exportName: 'MathInputSettingsService',
        members: [
          { kind: 'method', name: 'getSettings', signature: 'getSettings(): MathInputSettingsView', summary: 'Read the current plugin settings.', jsDoc: '/** Read the current plugin settings. */' },
          { kind: 'method', name: 'updateSettings', signature: 'updateSettings(patch: MathInputSettingsPatch, signal: AbortSignal): Promise<MathInputSettingsView>', summary: 'Update plugin settings when the request has not been cancelled.', jsDoc: '/** Update plugin settings when the request has not been cancelled. */' },
        ],
        types: [
          { name: 'MathInputSettingsView', declaration: 'export interface MathInputSettingsView { available: boolean; writable: boolean; settings: MathInputSettings; overridden: string[] }' },
          { name: 'MathInputSettingsPatch', declaration: 'export type MathInputSettingsPatch = Partial<MathInputSettings>' },
        ],
      },
    ],
    events: [],
    objects: [],
  },
} as const

export default TYPERT
```

- [ ] **Step 5: Implement src/remote.ts (replaces placeholder)**

```ts
import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import { mathInputSettingsPatchSchema, mathInputSettingsViewSchema } from './remote-contract.js'
import type { MathInputSettingsPatch, MathInputSettingsView } from './remote-contract.js'

export type MathInputRemote = ClientRemote['mathInput']

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespace$mathInput {
    getSettings: () => Promise<RemoteResult<MathInputSettingsView>>
    updateSettings: (patch: MathInputSettingsPatch, signal?: AbortSignal) => Promise<RemoteResult<MathInputSettingsView>>
  }

  interface TypertRemoteMap {
    'mathInput/getSettings': () => Promise<RemoteResult<MathInputSettingsView>>
    'mathInput/updateSettings': (patch: MathInputSettingsPatch, signal?: AbortSignal) => Promise<RemoteResult<MathInputSettingsView>>
  }

  interface TypertRemoteNamespaceMap {
    mathInput: TypertRemoteNamespace$mathInput
  }
}

export const TYPERT_REMOTE: TypertRemoteContribution = {
  package: 'dsh-math-input',
  descriptors: [
    {
      id: 'dsh-math-input#mathInput/getSettings',
      service: 'MathInput',
      namespace: 'mathInput',
      method: 'getSettings',
      invocation: { kind: 'direct' },
      parameters: [],
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-math-input#MathInputSettingsView',
        schema: mathInputSettingsViewSchema,
      },
    },
    {
      id: 'dsh-math-input#mathInput/updateSettings',
      service: 'MathInput',
      namespace: 'mathInput',
      method: 'updateSettings',
      invocation: { kind: 'direct' },
      parameters: [{
        name: 'patch',
        wire: 'patch',
        source: 'json',
        codec: { mode: 'strict', typeSymbol: 'dsh-math-input#MathInputSettingsPatch', schema: mathInputSettingsPatchSchema },
      }],
      cancellation: { parameter: 'signal' },
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-math-input#MathInputSettingsView',
        schema: mathInputSettingsViewSchema,
      },
    },
  ],
}

export default TYPERT_REMOTE
```

If the `declare module` augmentation shapes do not compile against the installed `dsh-typert-protocol` version, copy the exact augmentation structure from `C:\Users\asswsw\Downloads\dsh-better-input\src\remote.ts` and adapt the namespace names — do not invent a different shape.

- [ ] **Step 6: Run tests and typecheck**

```bash
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/remote-contract.ts src/typert.ts src/remote.ts test/contract.test.ts
git commit -m "feat: hand-written typert/remote settings contract"
```

---

### Task 8: Host settings service + settings schema

**Files:**
- Create: `src/config-schema.ts`, `src/settings-service.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Implement src/config-schema.ts (Host-only schemastery schema)**

```ts
import s from '@deepseek-ai/schemastery'
import { DEFAULT_SETTINGS } from './config.js'

export const MathInputSettingsSchema = s.object({
  recognitionMode: s.string().default(DEFAULT_SETTINGS.recognitionMode).description('Recognition vocabulary masking: auto | number | expression'),
  beamWidth: s.number().default(DEFAULT_SETTINGS.beamWidth).description('Beam search width: 1 (greedy) | 2 | 3 (best)'),
  executionProvider: s.string().default(DEFAULT_SETTINGS.executionProvider).description('ONNX execution provider: wasm | webgpu'),
  strokeDebounceSeconds: s.number().default(DEFAULT_SETTINGS.strokeDebounceSeconds).description('Pen idle seconds before auto recognition'),
  language: s.string().default(DEFAULT_SETTINGS.language).description('UI language override; empty follows the DSH locale'),
})
```

- [ ] **Step 2: Implement src/settings-service.ts**

```ts
import type { Context } from '@deepseek-ai/cordis'
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import type { SettingsScope } from '@deepseek-ai/dsh-settings'
import { DEFAULT_SETTINGS, validateSettings, type MathInputSettings, type MathInputSettingsPatch, type MathInputSettingsView } from './config.js'
import { MathInputSettingsSchema } from './config-schema.js'

export const SETTINGS_NAMESPACE = 'dsh-math-input'

export class MathInputSettingsService extends TypertRemoteService {
  static inject = ['settings']
  private readonly settings: SettingsScope<Record<string, unknown>>

  constructor(ctx: Context) {
    super(ctx, 'MathInput', { namespace: 'mathInput' })
    this.settings = ctx.settings.register(settingsNamespace(SETTINGS_NAMESPACE), MathInputSettingsSchema, {
      validate: validateSettings,
    })
  }

  getSettings(): MathInputSettingsView {
    const provider = this.ctx.get('settings') as { writable?: boolean } | undefined
    return {
      available: true,
      writable: provider?.writable ?? false,
      settings: flattenStoredSettings(this.settings.get()),
      overridden: [],
    }
  }

  async updateSettings(patch: MathInputSettingsPatch, signal: AbortSignal): Promise<MathInputSettingsView> {
    signal.throwIfAborted()
    const next: MathInputSettings = { ...flattenStoredSettings(this.settings.get()) }
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) (next as unknown as Record<string, unknown>)[key] = value
    }
    validateSettings(next)
    await this.settings.update(next as unknown as Record<string, unknown>)
    return this.getSettings()
  }
}

function flattenStoredSettings(raw: unknown): MathInputSettings {
  const record = (typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>
  return {
    recognitionMode: record.recognitionMode === 'number' || record.recognitionMode === 'expression' ? record.recognitionMode : DEFAULT_SETTINGS.recognitionMode,
    beamWidth: record.beamWidth === 1 || record.beamWidth === 2 || record.beamWidth === 3 ? record.beamWidth : DEFAULT_SETTINGS.beamWidth,
    executionProvider: record.executionProvider === 'webgpu' ? 'webgpu' : DEFAULT_SETTINGS.executionProvider,
    strokeDebounceSeconds: typeof record.strokeDebounceSeconds === 'number' ? record.strokeDebounceSeconds : DEFAULT_SETTINGS.strokeDebounceSeconds,
    language: typeof record.language === 'string' ? record.language : DEFAULT_SETTINGS.language,
  }
}
```

- [ ] **Step 3: Wire the Host entry src/index.ts**

```ts
import type { Context } from '@deepseek-ai/cordis'
import { MathInputSettingsService } from './settings-service.js'

export const name = 'dsh-math-input'

export async function apply(ctx: Context): Promise<void> {
  await ctx.plugin(MathInputSettingsService)
  ctx.effect(() => () => undefined, 'dsh-math-input lifecycle')
}
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm test
npm run build
```

Expected: all green; `lib/index.js` now imports the service.

- [ ] **Step 5: Commit**

```bash
git add src/config-schema.ts src/settings-service.ts src/index.ts lib/
git commit -m "feat: host settings service over dsh-settings namespace"
```

**Phase 1 checkpoint:** build passes; the Host half is installable. Overlay smoke test happens at the end of Task 10 (once the client renders the settings section).

---

### Task 9: Client shell — locale, remote mount, strings

**Files:**
- Modify: `src/client.ts`
- Create: `src/client/index.ts`, `src/client/strings.ts`

- [ ] **Step 1: Implement src/client/strings.ts**

```ts
/** Bilingual UI strings, registered as one namespace into the DSH locale runtime. */
export type MathInputStrings = {
  settingsTitle: string
  settingsDescription: string
  loading: string
  saveFailed: string
  recognitionModeLabel: string
  recognitionModeHint: string
  modeAuto: string
  modeNumber: string
  modeExpression: string
  beamWidthLabel: string
  beamWidthHint: string
  providerLabel: string
  providerHint: string
  debounceLabel: string
  debounceHint: string
  languageLabel: string
  languageHint: string
  languagePlaceholder: string
  launcherTitle: string
  menuHandwriting: string
  menuScreenshot: string
  menuLatexEditor: string
  padTitle: string
  padRecognizing: string
  padConfirm: string
  padCancel: string
  padClear: string
  padUndo: string
  ocrTitle: string
  ocrPasteHint: string
  ocrUpload: string
  editorTitle: string
  editorInsert: string
  previewTitle: string
}

export const MATH_INPUT_NS = 'math-input'

export const zh: MathInputStrings = {
  settingsTitle: '数学输入',
  settingsDescription: '手写识别、截图识别与 LaTeX 编辑器的本地设置。全部识别在浏览器内完成,不消耗 token。',
  loading: '加载中…',
  saveFailed: '保存失败,请重试',
  recognitionModeLabel: '识别模式',
  recognitionModeHint: 'auto:全部符号;number:数字与运算符;expression:数学表达式',
  modeAuto: '自动',
  modeNumber: '数字',
  modeExpression: '表达式',
  beamWidthLabel: 'Beam 宽度',
  beamWidthHint: '1 最快,3 质量最佳',
  providerLabel: '执行后端',
  providerHint: 'webgpu 自动探测,通常快 2–5 倍',
  debounceLabel: '停笔识别延迟(秒)',
  debounceHint: '停笔后自动触发识别的等待时间',
  languageLabel: '界面语言',
  languageHint: '留空跟随 DSH 语言',
  languagePlaceholder: 'zh / en,留空跟随',
  launcherTitle: '数学输入',
  menuHandwriting: '手写输入',
  menuScreenshot: '截图并识别',
  menuLatexEditor: 'LaTeX 语法编辑器',
  padTitle: '手写输入',
  padRecognizing: '识别中…',
  padConfirm: '确认插入',
  padCancel: '取消',
  padClear: '清空',
  padUndo: '撤销',
  ocrTitle: '截图识别',
  ocrPasteHint: 'Ctrl+V 粘贴图片,或上传文件',
  ocrUpload: '上传文件',
  editorTitle: 'LaTeX 编辑器',
  editorInsert: '插入',
  previewTitle: '预览',
}

export const en: MathInputStrings = {
  settingsTitle: 'Math Input',
  settingsDescription: 'Local settings for handwriting recognition, screenshot OCR, and the LaTeX editor. All recognition runs in your browser — zero tokens.',
  loading: 'Loading…',
  saveFailed: 'Save failed, please retry',
  recognitionModeLabel: 'Recognition mode',
  recognitionModeHint: 'auto: all symbols; number: digits and operators; expression: math expressions',
  modeAuto: 'Auto',
  modeNumber: 'Number',
  modeExpression: 'Expression',
  beamWidthLabel: 'Beam width',
  beamWidthHint: '1 is fastest, 3 gives best quality',
  providerLabel: 'Execution provider',
  providerHint: 'webgpu is auto-detected and typically 2–5x faster',
  debounceLabel: 'Stroke debounce (seconds)',
  debounceHint: 'Idle time before recognition starts automatically',
  languageLabel: 'Interface language',
  languageHint: 'Empty follows the DSH language',
  languagePlaceholder: 'zh / en, empty follows DSH',
  launcherTitle: 'Math input',
  menuHandwriting: 'Handwriting input',
  menuScreenshot: 'Screenshot and recognize',
  menuLatexEditor: 'LaTeX syntax editor',
  padTitle: 'Handwriting input',
  padRecognizing: 'Recognizing…',
  padConfirm: 'Confirm and insert',
  padCancel: 'Cancel',
  padClear: 'Clear',
  padUndo: 'Undo',
  ocrTitle: 'Screenshot OCR',
  ocrPasteHint: 'Paste with Ctrl+V, or upload a file',
  ocrUpload: 'Upload file',
  editorTitle: 'LaTeX editor',
  editorInsert: 'Insert',
  previewTitle: 'Preview',
}
```

- [ ] **Step 2: Implement src/client/index.ts**

```ts
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Loads the conversation SlotMap augmentation ('conversation.input.left' / 'conversation.input.dock').
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Loads the settings SlotMap augmentation ('settings.section').
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { TYPERT_REMOTE } from '../remote.js'
import { MATH_INPUT_NS, en, zh } from './strings.js'

export const inject = ['slots', 'remote', 'locale']

export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  const disposeRemote = await ctx.remote.$mount(TYPERT_REMOTE)
  const disposeLocaleDicts = ctx.locale.register(MATH_INPUT_NS, { zh, en })

  await ctx.inject(['slots', 'remote', 'remote.mathInput', 'locale'], async (remoteCtx) => {
    // Slot registrations land in Tasks 10–15 (settings section, launcher, dock
    // occupants). The remote.mathInput request above must stay in this inner
    // list only — the outer inject gates this plugin's own activation.
    void remoteCtx
    return () => undefined
  })

  return async () => {
    disposeLocaleDicts()
    await disposeRemote()
  }
}
```

- [ ] **Step 3: Point src/client.ts at the real entry**

```ts
export { apply, inject } from './client/index.js'
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm run build
```

Expected: green; `lib/client.js` contains the `__ModuleLoader__` wrapper.

- [ ] **Step 5: Commit**

```bash
git add src/client.ts src/client/index.ts src/client/strings.ts lib/
git commit -m "feat: client shell with remote mount and locale registration"
```

---

### Task 10: Settings controller + settings section

**Files:**
- Create: `src/client/settings-controller.ts`, `src/client/settings.tsx`
- Modify: `src/client/index.ts` (register `settings.section` occupant)

- [ ] **Step 1: Implement src/client/settings-controller.ts**

```ts
import { useSyncExternalStore } from 'react'
import { DEFAULT_SETTINGS, type MathInputSettings, type MathInputSettingsPatch, type MathInputSettingsView } from '../config.js'
import type { MathInputRemote } from '../remote.js'

export type SettingsStatus = 'loading' | 'ready' | 'error'

export type SettingsSnapshot = {
  readonly status: SettingsStatus
  readonly view: MathInputSettingsView
  readonly detail: string
}

const EMPTY_VIEW: MathInputSettingsView = {
  available: false,
  writable: false,
  settings: { ...DEFAULT_SETTINGS },
  overridden: [],
}

type Listener = () => void

export class SettingsController {
  private snapshot: SettingsSnapshot = { status: 'loading', view: EMPTY_VIEW, detail: '' }
  private readonly listeners = new Set<Listener>()
  private disposed = false

  constructor(private readonly remote: MathInputRemote) {}

  readonly getSnapshot = (): SettingsSnapshot => this.snapshot

  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  async refreshSettings(): Promise<void> {
    const result = await this.remote.getSettings()
    if (this.disposed) return
    this.snapshot = result.ok
      ? { status: 'ready', view: result.value, detail: '' }
      : { status: 'error', view: EMPTY_VIEW, detail: result.error.message }
    this.emit()
  }

  async update(patch: MathInputSettingsPatch): Promise<boolean> {
    const result = await this.remote.updateSettings(patch)
    if (this.disposed) return false
    if (!result.ok) return false
    this.snapshot = { status: 'ready', view: result.value, detail: '' }
    this.emit()
    return true
  }

  dispose(): void {
    this.disposed = true
    this.listeners.clear()
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}

export function useSettingsSnapshot(controller: SettingsController): SettingsSnapshot {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot)
}

export type SettingsFace = {
  readonly status: SettingsStatus
  readonly settings: MathInputSettings
}
```

- [ ] **Step 2: Implement src/client/settings.tsx**

```tsx
import { useEffect, useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { MathInputSettingsPatch } from '../config.js'
import type { SettingsController } from './settings-controller.js'
import { useSettingsSnapshot } from './settings-controller.js'

type Translate = TranslateNS<'math-input'>

export type SettingsSectionProps = {
  readonly close: () => void
  readonly t: Translate
  readonly settingsController: SettingsController
}

const inputStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid var(--dsw-alias-border-primary, rgba(0,0,0,0.15))',
  background: 'var(--dsw-alias-bg-layer-2, transparent)',
  color: 'var(--dsw-alias-label-primary, inherit)',
}

function Field(props: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{ display: 'block', fontWeight: 600, fontSize: 13 }}>{props.label}</span>
      <span style={{ display: 'block', fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{props.hint}</span>
      {props.children}
    </label>
  )
}

export function MathInputSettingsSection({ settingsController, t }: SettingsSectionProps) {
  const snapshot = useSettingsSnapshot(settingsController)
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    void settingsController.refreshSettings()
  }, [settingsController])

  if (snapshot.status === 'loading') return <p>{t('loading')}</p>

  const s = snapshot.view.settings
  const save = async (patch: MathInputSettingsPatch) => {
    setSaveFailed(false)
    const ok = await settingsController.update(patch)
    if (!ok) setSaveFailed(true)
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ marginTop: 0 }}>{t('settingsTitle')}</h2>
      <p style={{ opacity: 0.8 }}>{t('settingsDescription')}</p>
      {saveFailed ? <p style={{ color: 'var(--dsw-alias-state-error-secondary, #e5484d)' }}>{t('saveFailed')}</p> : null}

      <Field label={t('recognitionModeLabel')} hint={t('recognitionModeHint')}>
        <select style={inputStyle} value={s.recognitionMode} onChange={(event) => void save({ recognitionMode: event.target.value as 'auto' | 'number' | 'expression' })}>
          <option value="auto">{t('modeAuto')}</option>
          <option value="number">{t('modeNumber')}</option>
          <option value="expression">{t('modeExpression')}</option>
        </select>
      </Field>

      <Field label={t('beamWidthLabel')} hint={t('beamWidthHint')}>
        <select style={inputStyle} value={s.beamWidth} onChange={(event) => void save({ beamWidth: Number(event.target.value) })}>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </Field>

      <Field label={t('providerLabel')} hint={t('providerHint')}>
        <select style={inputStyle} value={s.executionProvider} onChange={(event) => void save({ executionProvider: event.target.value as 'wasm' | 'webgpu' })}>
          <option value="wasm">wasm</option>
          <option value="webgpu">webgpu</option>
        </select>
      </Field>

      <Field label={t('debounceLabel')} hint={t('debounceHint')}>
        <DebounceInput key={s.strokeDebounceSeconds} initial={s.strokeDebounceSeconds} onCommit={(value) => void save({ strokeDebounceSeconds: value })} style={inputStyle} />
      </Field>

      <Field label={t('languageLabel')} hint={t('languageHint')}>
        <LanguageInput key={s.language} initial={s.language} placeholder={t('languagePlaceholder')} onCommit={(value) => void save({ language: value })} style={inputStyle} />
      </Field>
    </div>
  )
}

function DebounceInput(props: { initial: number; onCommit: (value: number) => void; style: React.CSSProperties }) {
  const [text, setText] = useState(String(props.initial))
  return (
    <input
      type="number"
      min={0.3}
      max={10}
      step={0.1}
      value={text}
      style={props.style}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => {
        const value = Number(text)
        if (Number.isFinite(value) && value !== props.initial) props.onCommit(value)
      }}
    />
  )
}

function LanguageInput(props: { initial: string; placeholder: string; onCommit: (value: string) => void; style: React.CSSProperties }) {
  const [text, setText] = useState(props.initial)
  return (
    <input
      type="text"
      value={text}
      placeholder={props.placeholder}
      style={props.style}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => {
        const value = text.trim()
        if (value !== props.initial) props.onCommit(value)
      }}
    />
  )
}
```

- [ ] **Step 3: Register the settings.section occupant in src/client/index.ts**

Inside the `ctx.inject` callback (replacing the `void remoteCtx` placeholder), construct the controller and register:

```tsx
import { SettingsController } from './settings-controller.js'
import { MathInputSettingsSection } from './settings.jsx'
import type { MathInputRemote } from '../remote.js'

// ... inside the ctx.inject callback, before `return`:
const remote = remoteCtx.remote.mathInput as MathInputRemote
const controller = new SettingsController(remote)
void controller.refreshSettings()

remoteCtx.effect(() => () => controller.dispose(), 'dsh-math-input settings lifecycle')

remoteCtx.slots.inject('settings.section', () =>
  remoteCtx.slots.register(
    {
      name: 'settings.section',
      id: 'dsh-math-input',
      order: 17,
      label: () => ctx.locale.bind(MATH_INPUT_NS)('settingsTitle'),
      locale: MATH_INPUT_NS,
      inject: () => ({ settingsController: controller }),
    },
    MathInputSettingsSection
  )
)
```

Note the import uses `'./settings.jsx'` (tsdown resolves `.jsx` for the built `.tsx`; this matches better-input's emitted import style — if typecheck complains, import `'./settings.js'` instead and keep the file named `settings.tsx`).

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm run build
```

Expected: green.

- [ ] **Step 5: Phase 1 overlay smoke test**

```bash
cat > overlay.yml <<'EOF'
- insert:
    - id: dsh-math-input
      name: 'C:/Users/asswsw/Downloads/dsh-math-input/lib/index.js'
EOF
npx -y @deepseek-ai/dsh web --patch overlay.yml
```

Open `http://127.0.0.1:3080`, open Settings. Expected: a "Math Input" section appears with the five controls; changing a select persists across page reload (settings stored in the dsh profile). Stop the server afterwards. If the web profile deps are missing (`~/.dsh/profiles/web` was never installed), run `npx -y @deepseek-ai/dsh plugin --profile web list` first to force profile initialization, then retry.

- [ ] **Step 6: Commit**

```bash
git add src/client/ lib/ overlay.yml
git commit -m "feat: settings section wired through mathInput remote"
```

---

### Task 11: Recognition engine facade + mock pipeline

**Files:**
- Create: `src/recognition/engine.ts`
- Test: `test/engine-mock.test.ts`

The facade isolates UI code from ink-on. Candidate selection + validation is pure and tested here; the real ink-on wiring is Task 12.

- [ ] **Step 1: Write the failing test**

`test/engine-mock.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { pickValidLatex, type RecognitionResult } from '../src/recognition/engine.js'

test('picks the first KaTeX-valid candidate', () => {
  const results: RecognitionResult[] = [
    { latex: '\\frac{', score: 0.9 },
    { latex: '\\frac{a}{b}', score: 0.7 },
    { latex: 'x^2', score: 0.5 },
  ]
  assert.equal(pickValidLatex(results), '\\frac{a}{b}')
})

test('repairs a repairable candidate when nothing is directly valid', () => {
  const results: RecognitionResult[] = [{ latex: '\\frac{a}{b', score: 0.9 }]
  assert.equal(pickValidLatex(results), '\\frac{a}{b}')
})

test('returns undefined when nothing works', () => {
  assert.equal(pickValidLatex([]), undefined)
  assert.equal(pickValidLatex([{ latex: '???', score: 1 }]), undefined)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement src/recognition/engine.ts**

```ts
import { isStrokeMeaningful, type Stroke } from './preprocess.js'
import { isValidLatex, repairLatex } from '../latex/repair.js'
import type { RecognitionMode, ExecutionProvider } from '../config.js'

export interface RecognitionResult {
  latex: string
  score: number
}

export interface RecognizeOptions {
  mode: RecognitionMode
  beamWidth: number
  provider: ExecutionProvider
}

export interface MathRecognizer {
  recognizeStrokes(strokes: readonly Stroke[], options: RecognizeOptions): Promise<RecognitionResult[]>
  recognizeTensor(tensor: Float32Array, width: number, height: number, options: RecognizeOptions): Promise<RecognitionResult[]>
  dispose(): void
}

export function pickValidLatex(results: readonly RecognitionResult[]): string | undefined {
  const ordered = [...results].sort((a, b) => b.score - a.score)
  for (const result of ordered) {
    if (isValidLatex(result.latex)) return result.latex
  }
  for (const result of ordered) {
    const repaired = repairLatex(result.latex)
    if (isValidLatex(repaired)) return repaired
  }
  return undefined
}

export interface EngineSettingsLike {
  recognitionMode: RecognitionMode
  beamWidth: number
  executionProvider: ExecutionProvider
}

export function recognizeOptionsFrom(settings: EngineSettingsLike): RecognizeOptions {
  return { mode: settings.recognitionMode, beamWidth: settings.beamWidth, provider: settings.executionProvider }
}

/** Full stroke pipeline: noise filter -> recognizer -> candidate selection. */
export async function recognizeStrokes(
  recognizer: MathRecognizer,
  strokes: readonly Stroke[],
  options: RecognizeOptions,
): Promise<string | undefined> {
  if (!isStrokeMeaningful(strokes)) return undefined
  const results = await recognizer.recognizeStrokes(strokes, options)
  return pickValidLatex(results)
}

let shared: MathRecognizer | undefined

/** Lazy process-wide recognizer; Task 12 backs this with ink-on. */
export function getSharedRecognizer(): MathRecognizer {
  if (shared === undefined) shared = createInkOnRecognizer()
  return shared
}

export function setSharedRecognizerForTests(recognizer: MathRecognizer | undefined): void {
  shared = recognizer
}

function createInkOnRecognizer(): MathRecognizer {
  // Implemented in Task 12 against the installed ink-on package.
  throw new Error('ink-on recognizer is not wired yet (Task 12)')
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/recognition/engine.ts test/engine-mock.test.ts
git commit -m "feat: recognizer facade with candidate selection pipeline"
```

---

### Task 12: Wire ink-on into the engine (open question 2)

**Files:**
- Modify: `src/recognition/engine.ts` (`createInkOnRecognizer`)
- Reference: `node_modules/ink-on/` (read its README + `dist/*.d.ts` after install — this task adapts to the real API; do not guess signatures)

- [ ] **Step 1: Inspect the installed ink-on API surface**

```bash
npm ls ink-on
node -e "import('ink-on').then(m => console.log(Object.keys(m)))"
```

Record: model-loading entry (InferenceEngine or similar), the vocab/asset URLs it expects, whether it spawns its own worker, and its stroke preprocessing exports.

- [ ] **Step 2: Implement createInkOnRecognizer against that surface**

Required behavior (whatever the exact ink-on calls are):
1. Lazy-load model artifacts on first use; cache via ink-on's IndexedDB cache if provided, otherwise fetch `encoder.onnx` / `decoder.onnx` / `vocab.json` from the ink-on GitHub release URLs found in step 1 and store blobs in IndexedDB under database `dsh-math-input-models`.
2. Configure the ONNX execution provider from `options.provider`; fall back to wasm when webgpu is unavailable (`navigator.gpu === undefined`).
3. `recognizeStrokes`: convert `Stroke[]` using ink-on's stroke preprocessing (or ours if ink-on expects raw points), run encoder+decoder with `options.beamWidth`, return `RecognitionResult[]` (latex + score).
4. `recognizeTensor`: feed the already-preprocessed Float32 tensor straight into the encoder.
5. `dispose`: release ONNX sessions.

Structure the implementation so the lazy init lives in a private async `ensureReady()` and both recognize methods await it.

- [ ] **Step 3: Add a browser-only manual verification (no unit test — needs WASM)**

Build and use the overlay from Task 10 step 5; temporarily call the engine from the settings section console (or proceed to Task 13 and verify through the handwriting pad). Checklist:
- first load downloads ~7.2 MB (DevTools network), second load hits IndexedDB cache
- recognition completes in ~1–2 s on a simple `x^2`
- `provider: 'webgpu'` does not throw on a machine without WebGPU (falls back)

- [ ] **Step 4: Update docs/ARCHITECTURE.md Open Questions item 2** — replace it with the pinned artifact URLs + checksums you actually used, and move the note to `docs/recognition-engine.md` (created in Task 16).

- [ ] **Step 5: Run gates and commit**

```bash
npm run typecheck
npm test
npm run build
git add src/recognition/engine.ts docs/ lib/
git commit -m "feat: ink-on backed recognizer with IndexedDB model cache"
```

**Phase 2 checkpoint:** after Task 13 (handwriting pad), the handwriting path works end-to-end in the overlay.

---

### Task 13: Handwriting pad (portal modal) + launcher

**Files:**
- Create: `src/client/ui/modal.tsx`, `src/client/handwriting-pad.tsx`, `src/client/launcher.tsx`, `src/client/ui-store.ts`
- Modify: `src/client/index.ts` (register `conversation.input.left` occupant + dock toggle store)

- [ ] **Step 1: Implement src/client/ui/modal.tsx (shared portal frame)**

```tsx
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type ModalProps = {
  readonly title: string
  readonly onClose: () => void
  readonly children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      data-math-input-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.45)',
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        style={{
          minWidth: 520,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 12,
          padding: 16,
          background: 'var(--dsw-alias-bg-layer-1, #fff)',
          color: 'var(--dsw-alias-label-primary, inherit)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button type="button" aria-label="close" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
```

- [ ] **Step 2: Implement src/client/ui-store.ts (cross-slot UI state)**

```ts
type Listener = () => void

export class MathInputUiStore {
  latexDockOpen = false
  private readonly listeners = new Set<Listener>()

  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  readonly getLatexDockOpen = (): boolean => this.latexDockOpen

  toggleLatexDock(): void {
    this.latexDockOpen = !this.latexDockOpen
    this.emit()
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}
```

- [ ] **Step 3: Implement src/client/handwriting-pad.tsx**

```tsx
import { useEffect, useRef, useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { Modal } from './ui/modal.jsx'
import { renderLatex } from '../latex/render.js'
import type { Stroke } from '../recognition/preprocess.js'
import { recognizeStrokes, getSharedRecognizer, recognizeOptionsFrom } from '../recognition/engine.js'
import { effectiveDebounceMs, type MathInputSettings } from '../config.js'

type Translate = TranslateNS<'math-input'>

export type HandwritingPadProps = {
  readonly t: Translate
  readonly settings: MathInputSettings
  readonly onClose: () => void
  readonly onInsert: (latex: string) => void
}

export function HandwritingPad({ t, settings, onClose, onInsert }: HandwritingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const strokesRef = useRef<Stroke[]>([])
  const drawingRef = useRef<Stroke | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [latex, setLatex] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
  }, [])

  const redraw = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (canvas === null || canvas === undefined || context === null) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.lineWidth = 2.5
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = '#111'
    for (const stroke of strokesRef.current) {
      if (stroke.points.length === 0) continue
      context.beginPath()
      const first = stroke.points[0]
      if (first === undefined) continue
      context.moveTo(first.x, first.y)
      for (const point of stroke.points.slice(1)) context.lineTo(point.x, point.y)
      context.stroke()
    }
  }

  const runRecognition = async (strokes: Stroke[]) => {
    setBusy(true)
    try {
      const result = await recognizeStrokes(getSharedRecognizer(), strokes, recognizeOptionsFrom(settings))
      if (result !== undefined) {
        setLatex(result)
        if (previewRef.current !== null) renderLatex(result, previewRef.current)
      }
    } finally {
      setBusy(false)
    }
  }

  const armDebounce = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void runRecognition([...strokesRef.current])
    }, effectiveDebounceMs(settings))
  }

  const pointerPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  return (
    <Modal title={t('padTitle')} onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button type="button" onClick={() => { strokesRef.current.pop(); redraw() }}>{t('padUndo')}</button>
        <button type="button" onClick={() => { strokesRef.current = []; redraw(); setLatex('') }}>{t('padClear')}</button>
      </div>
      <canvas
        ref={canvasRef}
        width={640}
        height={280}
        style={{ border: '1px solid var(--dsw-alias-border-primary, rgba(0,0,0,0.15))', borderRadius: 8, touchAction: 'none', background: '#fff' }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          const stroke: Stroke = { points: [pointerPosition(event)] }
          drawingRef.current = stroke
          strokesRef.current = [...strokesRef.current, stroke]
          redraw()
        }}
        onPointerMove={(event) => {
          const stroke = drawingRef.current
          if (stroke === null) return
          stroke.points.push(pointerPosition(event))
          redraw()
        }}
        onPointerUp={() => {
          drawingRef.current = null
          armDebounce()
        }}
      />
      <div style={{ marginTop: 12, minHeight: 48 }} ref={previewRef} data-math-input-preview="true" />
      <textarea
        value={latex}
        onChange={(event) => setLatex(event.target.value)}
        rows={2}
        style={{ width: '100%', fontFamily: 'monospace' }}
        aria-label="latex source"
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button type="button" onClick={onClose}>{t('padCancel')}</button>
        <button
          type="button"
          disabled={busy || latex.trim() === ''}
          onClick={() => {
            onInsert(latex.trim())
            onClose()
          }}
        >
          {busy ? t('padRecognizing') : t('padConfirm')}
        </button>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 4: Implement src/client/launcher.tsx**

```tsx
import { useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { HandwritingPad } from './handwriting-pad.jsx'
import type { MathInputUiStore } from './ui-store.js'
import type { SettingsFace } from './settings-controller.js'

type Translate = TranslateNS<'math-input'>

export type LauncherProps = {
  readonly input: { readonly draft: string }
  readonly inputActions: { setDraft(text: string): void }
  readonly t: Translate
  readonly useSettings: () => SettingsFace
  readonly uiStore: MathInputUiStore
}

type WindowKind = 'none' | 'handwriting' | 'screenshot'

const menuItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '8px 12px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: 'inherit',
}

export function Launcher({ input, inputActions, t, useSettings, uiStore }: LauncherProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [window, setWindow] = useState<WindowKind>('none')
  const settingsFace = useSettings()
  const settings = settingsFace.settings

  const insertLatex = (latex: string) => {
    const draft = input.draft
    const separator = draft === '' || /\s$/.test(draft) ? '' : ' '
    inputActions.setDraft(`${draft}${separator}\\[${latex}\\]`)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        title={t('launcherTitle')}
        aria-label={t('launcherTitle')}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        style={{
          width: 28,
          height: 28,
          border: 'none',
          borderRadius: 6,
          background: 'transparent',
          color: 'var(--dsw-alias-label-primary, inherit)',
          cursor: 'pointer',
          fontSize: 16,
        }}
      >
        +
      </button>
      {menuOpen ? (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: 6,
            minWidth: 180,
            borderRadius: 8,
            padding: 4,
            zIndex: 8500,
            background: 'var(--dsw-alias-bg-layer-2, #fff)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
          }}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <button type="button" style={menuItemStyle} onClick={() => { setMenuOpen(false); setWindow('handwriting') }}>
            {t('menuHandwriting')}
          </button>
          <button type="button" style={menuItemStyle} onClick={() => { setMenuOpen(false); setWindow('screenshot') }}>
            {t('menuScreenshot')}
          </button>
          <button type="button" style={menuItemStyle} onClick={() => { setMenuOpen(false); uiStore.toggleLatexDock() }}>
            {t('menuLatexEditor')}
          </button>
        </div>
      ) : null}
      {window === 'handwriting' ? (
        <HandwritingPad t={t} settings={settings} onClose={() => setWindow('none')} onInsert={insertLatex} />
      ) : null}
      {/* screenshot window mounts here in Task 14 */}
    </div>
  )
}
```

- [ ] **Step 5: Register the launcher in src/client/index.ts**

Add to the `ctx.inject` callback (after the settings section registration):

```tsx
import { MathInputUiStore } from './ui-store.js'
import { Launcher } from './launcher.jsx'
import { useSettingsSnapshot, type SettingsFace } from './settings-controller.js'

// ... inside ctx.inject callback:
const uiStore = new MathInputUiStore()

const useSettings = (): SettingsFace => {
  const snapshot = useSettingsSnapshot(controller)
  return { status: snapshot.status, settings: snapshot.view.settings }
}

remoteCtx.slots.inject('conversation.input.left', () =>
  remoteCtx.slots.register(
    {
      name: 'conversation.input.left',
      id: 'math-input-launcher',
      order: 10,
      locale: MATH_INPUT_NS,
      inject: () => ({ useSettings, uiStore }),
    },
    Launcher
  )
)
```

- [ ] **Step 6: Verify in the overlay**

Rebuild (`npm run build`) and rerun the overlay command from Task 10 step 5. Expected: a "+" button to the left of the input row; clicking opens the three-item menu; opening handwriting shows the modal; drawing nothing and confirming stays disabled. Recognition itself errors until Task 12 is wired — expected at this point if Task 12 is not done; do Task 12 first when running Phase 2 checkpoint.

- [ ] **Step 7: Commit**

```bash
git add src/client/ lib/
git commit -m "feat: launcher menu and handwriting pad modal"
```

---

### Task 14: Screenshot OCR window + LaTeX editor dock

**Files:**
- Create: `src/client/screenshot-ocr.tsx`, `src/client/latex-editor.tsx`
- Modify: `src/client/launcher.tsx` (mount screenshot window), `src/client/index.ts` (register dock occupant)

- [ ] **Step 1: Implement src/client/screenshot-ocr.tsx**

```tsx
import { useEffect, useRef, useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { Modal } from './ui/modal.jsx'
import { renderLatex } from '../latex/render.js'
import { imageToTensor } from '../recognition/image-preprocess.js'
import { pickValidLatex, getSharedRecognizer, recognizeOptionsFrom } from '../recognition/engine.js'
import type { MathInputSettings } from '../config.js'

type Translate = TranslateNS<'math-input'>

export type ScreenshotOcrProps = {
  readonly t: Translate
  readonly settings: MathInputSettings
  readonly onClose: () => void
  readonly onInsert: (latex: string) => void
}

export function ScreenshotOcr({ t, settings, onClose, onInsert }: ScreenshotOcrProps) {
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [latex, setLatex] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) => entry.type.startsWith('image/'))
      const file = item?.getAsFile()
      if (file !== undefined && file !== null) void recognizeFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  })

  const recognizeFile = async (file: File) => {
    setBusy(true)
    setError('')
    try {
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')
      if (context === null) throw new Error('canvas 2d context unavailable')
      context.drawImage(bitmap, 0, 0)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const tensor = imageToTensor({ width: imageData.width, height: imageData.height, data: imageData.data })
      const results = await getSharedRecognizer().recognizeTensor(tensor.values, tensor.width, tensor.height, recognizeOptionsFrom(settings))
      const picked = pickValidLatex(results)
      if (picked === undefined) {
        setError('No formula recognized')
      } else {
        setLatex(picked)
        if (previewRef.current !== null) renderLatex(picked, previewRef.current)
      }
      bitmap.close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={t('ocrTitle')} onClose={onClose}>
      <p style={{ opacity: 0.8 }}>{t('ocrPasteHint')}</p>
      <input
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file !== undefined) void recognizeFile(file)
        }}
      />
      <div style={{ marginTop: 12, minHeight: 48 }} ref={previewRef} />
      {error !== '' ? <p style={{ color: 'var(--dsw-alias-state-error-secondary, #e5484d)' }}>{error}</p> : null}
      <textarea value={latex} onChange={(event) => setLatex(event.target.value)} rows={2} style={{ width: '100%', fontFamily: 'monospace' }} aria-label="latex source" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button type="button" onClick={onClose}>{t('padCancel')}</button>
        <button
          type="button"
          disabled={busy || latex.trim() === ''}
          onClick={() => {
            onInsert(latex.trim())
            onClose()
          }}
        >
          {busy ? t('padRecognizing') : t('padConfirm')}
        </button>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Mount it from the launcher**

In `src/client/launcher.tsx`: change `WindowKind` handling — import `ScreenshotOcr` and replace the `{/* screenshot window mounts here in Task 14 */}` comment with:

```tsx
{window === 'screenshot' ? (
  <ScreenshotOcr t={t} settings={settings} onClose={() => setWindow('none')} onInsert={insertLatex} />
) : null}
```

- [ ] **Step 3: Implement src/client/latex-editor.tsx (dock occupant)**

```tsx
import { useMemo, useRef, useState } from 'react'
import { useSyncExternalStore } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { renderLatex } from '../latex/render.js'
import type { MathInputUiStore } from './ui-store.js'

type Translate = TranslateNS<'math-input'>

const GREEK = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda', 'mu', 'pi', 'sigma', 'phi', 'omega'] as const
const TEMPLATES = ['\\frac{}{}', '\\sqrt{}', '\\sum_{}^{}', '\\int_{}^{}', 'x^{2}', 'x_{i}', '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}'] as const

export type LatexEditorDockProps = {
  readonly input: { readonly draft: string }
  readonly inputActions: { setDraft(text: string): void }
  readonly t: Translate
  readonly uiStore: MathInputUiStore
}

export function LatexEditorDock({ input, inputActions, t, uiStore }: LatexEditorDockProps) {
  const open = useSyncExternalStore(uiStore.subscribe, uiStore.getLatexDockOpen)
  const [source, setSource] = useState('')
  const previewRef = useRef<HTMLDivElement | null>(null)

  useMemo(() => {
    if (previewRef.current !== null && source.trim() !== '') renderLatex(source, previewRef.current)
  }, [source])

  if (!open) return null

  const insertSnippet = (snippet: string) => {
    setSource((current) => current + snippet)
  }

  const confirm = () => {
    const trimmed = source.trim()
    if (trimmed === '') return
    const draft = input.draft
    const separator = draft === '' || /\s$/.test(draft) ? '' : ' '
    inputActions.setDraft(`${draft}${separator}\\[${trimmed}\\]`)
    setSource('')
    uiStore.toggleLatexDock()
  }

  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 4px', alignItems: 'stretch' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <textarea
          value={source}
          onChange={(event) => setSource(event.target.value)}
          rows={3}
          style={{ width: '100%', fontFamily: 'monospace' }}
          aria-label={t('editorTitle')}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {GREEK.map((symbol) => (
            <button key={symbol} type="button" onClick={() => insertSnippet(`\\${symbol} `)} style={paletteButtonStyle}>
              {symbol}
            </button>
          ))}
          {TEMPLATES.map((template) => (
            <button key={template} type="button" onClick={() => insertSnippet(template)} style={paletteButtonStyle}>
              {template.length > 12 ? `${template.slice(0, 12)}…` : template}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{t('previewTitle')}</div>
        <div ref={previewRef} style={{ minHeight: 48 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-end' }}>
        <button type="button" onClick={confirm} disabled={source.trim() === ''}>{t('editorInsert')}</button>
      </div>
    </div>
  )
}

const paletteButtonStyle: React.CSSProperties = {
  padding: '2px 6px',
  fontSize: 12,
  borderRadius: 4,
  border: '1px solid var(--dsw-alias-border-primary, rgba(0,0,0,0.15))',
  background: 'transparent',
  cursor: 'pointer',
  color: 'inherit',
}
```

- [ ] **Step 4: Register the dock occupant in src/client/index.ts**

```tsx
import { LatexEditorDock } from './latex-editor.jsx'

// ... inside ctx.inject callback:
remoteCtx.slots.inject('conversation.input.dock', () =>
  remoteCtx.slots.register(
    {
      name: 'conversation.input.dock',
      id: 'math-input-latex-editor',
      order: 30,
      locale: MATH_INPUT_NS,
      inject: () => ({ uiStore }),
    },
    LatexEditorDock
  )
)
```

- [ ] **Step 5: Verify in the overlay**

Rebuild, restart the overlay. Expected: screenshot window accepts an uploaded formula image and produces LaTeX (Task 12 must be wired); LaTeX editor toggles from the menu above the composer, palette inserts snippets, Insert writes `\[...\]` into the draft.

- [ ] **Step 6: Commit**

```bash
git add src/client/ lib/
git commit -m "feat: screenshot OCR window and LaTeX editor dock"
```

---

### Task 15: Inline renderer preview strip

**Files:**
- Create: `src/client/inline-renderer.tsx`
- Modify: `src/client/index.ts` (register second dock occupant)

- [ ] **Step 1: Implement src/client/inline-renderer.tsx**

v1 strategy per ARCHITECTURE.md: the composer draft is a plain string, so we render a live preview strip in the dock for every closed block; clicking a block replaces the draft's block with editable source (it already is source — the affordance focuses the editor dock with that block). Full in-place rendering is Open Question 1.

```tsx
import { useEffect, useMemo, useRef } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { detectMathBlocks, renderLatex } from '../latex/render.js'

type Translate = TranslateNS<'math-input'>

export type InlineRendererProps = {
  readonly input: { readonly draft: string }
  readonly inputActions: { setDraft(text: string): void }
  readonly t: Translate
}

function FormulaChip({ latex }: { latex: string }) {
  const ref = useRef<HTMLSpanElement | null>(null)
  useEffect(() => {
    if (ref.current !== null) renderLatex(latex, ref.current)
  }, [latex])
  return (
    <span
      ref={ref}
      data-math-input-chip="true"
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 6,
        background: 'var(--dsw-alias-bg-layer-3, rgba(0,0,0,0.04))',
      }}
    />
  )
}

export function InlineRendererStrip({ input, t }: InlineRendererProps) {
  const blocks = useMemo(() => detectMathBlocks(input.draft).filter((block) => block.closed && block.latex.trim() !== ''), [input.draft])
  if (blocks.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', padding: '4px' }} aria-label={t('previewTitle')}>
      {blocks.map((block) => (
        <FormulaChip key={`${block.start}:${block.latex}`} latex={block.latex} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Register in src/client/index.ts**

```tsx
import { InlineRendererStrip } from './inline-renderer.jsx'

// ... inside ctx.inject callback:
remoteCtx.slots.inject('conversation.input.dock', () =>
  remoteCtx.slots.register(
    {
      name: 'conversation.input.dock',
      id: 'math-input-preview-strip',
      order: 25,
      locale: MATH_INPUT_NS,
      inject: () => ({}),
    },
    InlineRendererStrip
  )
)
```

- [ ] **Step 3: Verify in the overlay**

Type `\[x^2\]` in the composer. Expected: a rendered chip appears in the preview strip; unclosed `\[` shows nothing.

- [ ] **Step 4: Commit**

```bash
git add src/client/ lib/
git commit -m "feat: inline LaTeX preview strip over composer draft"
```

---

### Task 16: Docs, CI, final gates

**Files:**
- Create: `docs/local-testing.md`, `docs/recognition-engine.md`, `.github/workflows/ci.yml`
- Modify: `README.md`, `README_CN.md` (fix `<owner>` placeholders only if the repo has a GitHub owner; otherwise leave)

- [ ] **Step 1: Write docs/local-testing.md**

Content: the two install modes from ARCHITECTURE.md "Local testing" section, expanded with the exact overlay.yml used in Task 10, prerequisites (Node >= 20, Chrome/Edge), verification checklist ("+" button, menu opens, handwriting pad modal renders, settings section persists, preview strip renders `\[x^2\]`), and troubleshooting (absolute path requirement; profile initialization; SharedArrayBuffer fallback note).

- [ ] **Step 2: Write docs/recognition-engine.md**

Content: CoMER choice vs pix2tex (handwritten-first use case, 7.2 MB, CROHME), ink-on selection (Apache-2.0, framework-agnostic core, built-in repair), the printed-formula caveat and pix2tex fallback path behind the same `MathRecognizer` interface, the pinned asset URLs/checksums recorded in Task 12, and the AGPL exclusion (lia-canvas-ocr).

- [ ] **Step 3: Write .github/workflows/ci.yml**

```yaml
name: ci

on:
  push:
  pull_request:

jobs:
  quality:
    strategy:
      fail-fast: false
      matrix:
        node: [20, 22, 24]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - name: committed lib matches fresh build
        run: |
          if [ -n "$(git status --porcelain lib)" ]; then
            echo "::error::lib/ drifted from a fresh build"
            git status --porcelain lib
            exit 1
          fi
```

- [ ] **Step 4: Final gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
git status --porcelain lib
```

Expected: all green, empty lib status.

- [ ] **Step 5: Commit**

```bash
git add docs/local-testing.md docs/recognition-engine.md .github/workflows/ci.yml lib/
git commit -m "docs+ci: local testing guide, engine decision record, CI matrix"
```

---

## Open questions carried from ARCHITECTURE.md

1. **Composer DOM for true in-place rendering** — Task 15 ships the dock preview strip. During Phase 3 verification, open DevTools on the running composer, identify the textarea/contenteditable structure, and judge whether a version-tolerant overlay is feasible. If yes, file a follow-up task; if no, close the question in the doc with the probe evidence.
2. **ink-on asset URLs** — resolved inside Task 12; the plan deliberately defers exact URLs to inspection of the installed package rather than hardcoding guesses.

## Self-review notes

- Spec coverage: every ARCHITECTURE.md component maps to a task (launcher→13, handwriting→13, screenshot→14, editor→14, inline renderer→15, settings→10, engine→11/12, contract→7, host→8, build→1, CI→16, docs→16). Open Questions carried explicitly.
- Placeholder scan: the only deliberate deferrals are ink-on API adaptation (Task 12, instructed to read the installed package) and composer-DOM probing (open question 1) — both are user-sanctioned edge work, not plan gaps.
- Type consistency: `MathInputSettings` fields (recognitionMode/beamWidth/executionProvider/strokeDebounceSeconds/language) are identical across Tasks 2, 7, 8; remote namespace `mathInput` consistent across 7, 9, 10; `MathInputRemote` used consistently; `MathInputUiStore` API (subscribe/getLatexDockOpen/toggleLatexDock) identical in 13 and 14.
