# dsh-math-input

**English** | [中文](./README_CN.md)

A zero-token, fully offline math input plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH). Handwrite formulas, OCR them from screenshots, or edit LaTeX directly — all recognized in your browser, no API key, no token cost.

## What it does

DSH's composer is plain text. If you want the model to reason about a formula, you type LaTeX by hand — slow and error-prone. This plugin adds three input methods plus inline rendering:

- **Handwriting input** — draw on a canvas with mouse, touch, or stylus; a browser-side neural network (CoMER) recognizes it as LaTeX.
- **Screenshot OCR** — paste or upload an image of a formula; the same engine extracts LaTeX.
- **LaTeX editor** — a dock panel with a symbol palette (Greek letters, fractions, integrals) and live KaTeX preview.
- **Inline rendering** — type `\[ ... \]` in the composer and the formula renders inline with KaTeX; click it to edit the source again.

All recognition runs via ONNX Runtime Web (WASM/WebGPU). The model is 7.2 MB, downloaded once and cached in IndexedDB. The plugin never calls `ctx.llm` — your token bill stays at zero.

## Install

Prerequisites: DeepSeek Harness `>= 0.1.1-rc.2`, Node.js `>= 20.0.0`, Chrome or Edge.

```
# from npm (recommended)
dsh plugin --profile web add dsh-math-input

# from GitHub
dsh plugin --profile web add github:<owner>/dsh-math-input

# without global dsh CLI
npx -y @deepseek-ai/dsh plugin --profile web add dsh-math-input
```

Refresh the web UI after install. A "+" button appears to the left of the model selector.

## Usage

Click the "+" button to open the input method menu:

1. **Handwriting** — draw on the canvas. Stop for 1.5 seconds and the engine recognizes automatically. Review the KaTeX preview, tweak the LaTeX if needed, click confirm. The formula enters the composer as `\[ ... \]` and renders inline.
2. **Screenshot** — paste an image (Ctrl+V), upload a file, or capture from the browser. The engine extracts LaTeX from the image.
3. **LaTeX editor** — type LaTeX directly with a symbol palette and live preview.

In the composer, any `\[ ... \]` you write (or paste) renders inline. Click the rendered block to switch back to the source.

## Settings

Open Settings → Math Input to configure recognition mode (auto / number / expression), beam width, execution provider (wasm / webgpu), stroke debounce delay, model cache, and interface language.

## Local testing

See [docs/local-testing.md](./docs/local-testing.md) for the full walkthrough. Quick version:

```
npm install
npm run build

# create overlay.yml with absolute path to lib/index.js
npx @deepseek-ai/dsh web --patch overlay.yml
```

Verify the "+" button and three input windows. To test the GitHub install path:

```
dsh plugin --profile web add github:<owner>/dsh-math-input
```

## Development

```
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # ESLint 9
npm test            # node:test + tsx
npm run build       # tsc -> lib/
```

CI runs across Node 20 / 22 / 24: typecheck, lint, unit tests, build, and a check that committed `lib/` matches a fresh build.

## Documentation

- [Architecture (English)](./docs/ARCHITECTURE.md) | [架构(中文)](./docs/ARCHITECTURE.zh-CN.md)
- [Recognition engine selection](./docs/recognition-engine.md)
- [Local testing guide](./docs/local-testing.md)
- [Contributing](./CONTRIBUTING.md) | [贡献指南](./CONTRIBUTING.zh-CN.md)
- [Changelog](./CHANGELOG.md)

## License

MIT
