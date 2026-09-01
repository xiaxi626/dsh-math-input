# dsh-math-input

**English** | [中文](./README_CN.md)

A zero-token, fully offline math input plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH). Handwrite formulas, OCR them from screenshots, or edit LaTeX directly — all recognized in your browser, no API key, no token cost.

## Why you need it

DSH's composer is plain text. If you want the model to reason about a formula, you type LaTeX by hand — slow and error-prone. This plugin adds three input methods plus inline rendering:

| Input method | Best for | Engine |
|---|---|---|
| **Handwriting** | Have a stylus / mouse, want to write a formula fast | CoMER neural network (ONNX Runtime Web) |
| **Screenshot OCR** | Already have a formula image (PDF screenshot, etc.) | Same engine, image-to-tensor recognition |
| **LaTeX editor** | Know LaTeX syntax, want a symbol palette | No recognition needed, direct input |
| **Inline rendering** | Type `\[ ... \]` in the composer, auto-renders | KaTeX |

All recognition runs via ONNX Runtime Web (WASM / WebGPU). The model is 7.2 MB, downloaded once and cached in IndexedDB. The plugin never calls `ctx.llm` — your token bill stays at zero.

## Install

### Prerequisites

- DeepSeek Harness `>= 0.1.1-rc.2`
- Node.js `>= 20.0.0`
- Chrome or Edge (for WebGPU support and SharedArrayBuffer)

### Install the plugin

```bash
# from GitHub
dsh plugin --profile web add github:<owner>/dsh-math-input

# without global dsh CLI
npx @deepseek-ai/dsh plugin --profile web add dsh-math-input
```

**Restart the DSH profile** after install (stop and re-run `dsh web`). A "+" button appears to the left of the input row — that means the install succeeded.

## Uninstall

```bash
# remove from DSH profile
dsh plugin --profile web remove dsh-math-input

# or without global CLI
npx @deepseek-ai/dsh plugin --profile web remove dsh-math-input
```

Restart the DSH profile. The "+" button and all input windows will be removed.

> The model cache (IndexedDB database `math-handwrite-models`) is not automatically cleared. To clean it up manually, go to browser DevTools → Application → IndexedDB and delete the database.

## Usage

Click the "+" button to the left of the input row to open the menu:

### 1. Handwriting input

1. Click **"Handwriting input"** in the menu — a canvas modal pops up
2. Draw a formula with mouse, touch, or stylus
3. Stop for ~1.5 seconds (configurable in Settings) — the engine recognizes automatically
4. The result renders as a KaTeX preview; the LaTeX source is editable below
5. Click **"Confirm and insert"** — the formula enters the composer as `\[ ... \]` and renders inline
6. Click **"Clear"** to start over, **"Undo"** to remove the last stroke

### 2. Screenshot OCR

1. Click **"Screenshot and recognize"** in the menu
2. **Ctrl+V** to paste an image, or click **"Upload file"** to select a local image
3. The engine extracts LaTeX from the image automatically
4. Review the preview and click **"Confirm and insert"**

### 3. LaTeX syntax editor

1. Click **"LaTeX syntax editor"** in the menu — a dock panel expands below the input row
2. The palette offers Greek letter buttons (`\alpha`, `\beta`, `\pi`, etc.) and template buttons (`\frac{}{}`, `\sqrt{}`, `\sum_{}^{}`, etc.)
3. Click any button to insert the corresponding LaTeX code into the editor
4. A live KaTeX preview renders on the right
5. Click **"Insert"** — the formula enters the composer as `\[ ... \]`

### Inline rendering

Any `\[ ... \]` you type (or paste) in the composer renders inline as a formula. For example, typing `\[x^2 + y^2 = r^2\]` renders the equation directly.

## Settings

Open **Settings → Math Input** to configure:

| Setting | Description | Options |
|---|---|---|
| Recognition mode | Limits the recognition vocabulary | auto (all), number (digits & operators), expression (math expressions) |
| Beam width | Quality vs speed trade-off | 1 (fastest), 2, 3 (best quality) |
| Execution provider | ONNX inference backend | wasm (universal), webgpu (needs Chrome 113+, typically 2–5x faster) |
| Stroke debounce | Idle time before auto-recognition | 0.3 – 10 seconds |
| Interface language | Override UI language | zh / en, empty follows DSH language |

Settings persist on the Host side and survive page reloads.

## Local testing

No need to push to GitHub or publish to npm — follow these five steps to verify locally.

### Step 1: Build the project

In the `dsh-math-input/` directory:

```bash
cd dsh-math-input
npm install
npm run build      # generates lib/ directory
```

> To check types without building, run `npm run typecheck` (tsc only, no output).

### Step 2: Link the local package

This plugin has both a Host entry and a Client bundle (`dsh.client` in
`package.json`). The Client is discovered through `node_modules`, so the
package must be linked first — an overlay alone won't load the UI.

**Windows (Git Bash / MINGW):**

```bash
PROJECT="$(cygpath -m ~/Downloads/dsh-math-input)"   # ← your path
npx @deepseek-ai/dsh plugin --profile web add "file:$PROJECT"
```

**macOS / Linux:**

```bash
PROJECT="$(pwd)"          # ← run from the repo root
npx @deepseek-ai/dsh plugin --profile web add "file:$PROJECT"
```

This creates a persistent link in the profile's `node_modules`. After code
changes, just `npm run build` and restart — **no reinstall needed**.

### Step 3: Launch DSH

```bash
npx @deepseek-ai/dsh web --no-open
```

Open `http://127.0.0.1:3080`.

> **Host-only testing without linking**: if you only need to test Host-side code
> (settings, typert manifest) without the Client UI, use an overlay patch instead.
> See [Local testing guide](docs/local-testing.md#overlay-alternative-host-only)
> for details.

### Step 4: Verify functionality

In the DSH web UI, check each item:

1. A **"+" button** appears to the left of the input row
2. Clicking "+" opens a menu with three items: **Handwriting**, **Screenshot**, **LaTeX editor**
3. **Handwriting pad**: modal renders, canvas accepts pointer drawing
4. **Settings**: Settings → Math Input shows five controls
5. Changing a setting persists across page reload
6. Type `\[x^2\]` in the composer — a KaTeX chip renders below
7. **LaTeX editor dock**: toggles from the menu, palette inserts snippets, Insert writes `\[...\]`

### Step 5: Re-test after code changes

After modifying code:

```bash
# rebuild
npm run build

# stop DSH (Ctrl+C), restart
npx @deepseek-ai/dsh web --no-open
```

## Notes & limitations

- **Model download**: first recognition triggers a ~7.2 MB download (encoder 3.4 MB + decoder 4.0 MB + vocab 4 KB); subsequent loads use IndexedDB cache.
- **WebGPU auto-fallback**: when `webgpu` is selected but the browser doesn't support it (requires Chrome 113+), the engine automatically falls back to `wasm`.
- **SharedArrayBuffer**: ONNX Runtime Web uses multi-threaded WASM when `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers are present. Without them, it falls back to single-threaded — recognition still works but is slower.
- **Handwritten vs printed**: the CoMER model is trained on the CROHME handwritten math expression dataset and optimized for handwriting. Screenshot OCR of printed formulas may underperform.
- **Browser compatibility**: requires a modern browser with WebAssembly SIMD support. Chrome / Edge recommended; Firefox mostly works; Safari has limited support.
- **Zero-token guarantee**: the plugin never calls `ctx.llm` — all recognition runs locally in the browser, with zero API costs.

## Development

```bash
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # ESLint 9
npm test            # node:test + tsx
npm run build       # tsdown + tsc → lib/
```

CI runs across Node 20 / 22 / 24: typecheck, lint, unit tests, build, and a check that committed `lib/` matches a fresh build.

## Documentation

- [Architecture (English)](./docs/ARCHITECTURE.md) | [架构 (中文)](./docs/ARCHITECTURE.zh-CN.md)
- [Recognition engine selection](./docs/recognition-engine.md)
- [Local testing guide](./docs/local-testing.md)
- [Plugin install verification](./docs/verify-plugin-install.md)
- [Contributing](./CONTRIBUTING.zh-CN.md)
- [Changelog](./CHANGELOG.md)

## License

MIT
