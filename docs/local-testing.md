# Local Testing

**English** | [中文](./local-testing.zh-CN.md)

## Prerequisites

- Node.js >= 20

- Chrome or Edge (for WebGPU support and SharedArrayBuffer)

## Install

```bash
npm install
npm run build
```

## Link-based testing (recommended)

This plugin has both a Host entry (`lib/index.js`) and a Client bundle
(`lib/client.js`, declared via `dsh.client` in `package.json`). The overlay
approach only loads the Host — the Client is discovered through `node_modules`,
so the package must be linked first.

### One-time setup: link the local package

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

This installs the package into the profile's `node_modules` via a persistent
link. After `npm run build`, the rebuilt `lib/` is immediately available —
**no reinstall needed**.

### Iterate: rebuild + restart

```bash
npm run build
npx @deepseek-ai/dsh web --no-open
```

Open `http://127.0.0.1:3080`.

### Cleanup: unlink when done

```bash
npx @deepseek-ai/dsh plugin --profile web remove dsh-math-input
```

## Overlay alternative (Host-only)

If you only need to test Host-side code (settings service, typert manifest,
etc.) and don't need the Client UI, use an overlay patch instead of linking:

Create `overlay.yml` in the project root:

```yaml
- insert:
    - id: dsh-math-input
      name: '/your/absolute/path/dsh-math-input/lib/index.js'
```

**Or generate it with a command** (from the project root):

**Windows (Git Bash / MINGW):**

```bash
cat > overlay.yml <<EOF
- insert:
    - id: dsh-math-input
      name: '/$(pwd -W)/lib/index.js'
EOF
```

> `pwd -W` outputs a Windows-style path (e.g. `C:/Users/xxx/dsh-math-input`).
> You must prefix it with `/`, resulting in `/C:/Users/xxx/dsh-math-input/lib/index.js`.
> Node.js ESM loader doesn't accept bare `C:/...` paths on Windows (treats `C:` as a
> protocol) — it must be `/C:/...` or `file:///C:/...`. Do **not** use `pwd` (outputs
> `/c/Users/...` which the loader resolves as `C:\c\Users\...`).

**macOS / Linux:**

```bash
cat > overlay.yml <<EOF
- insert:
    - id: dsh-math-input
      name: '$(pwd)/lib/index.js'
EOF
```

> `pwd` outputs a Unix-style path (e.g. `/Users/xxx/dsh-math-input`), which already
> starts with `/` — no extra prefix needed.

Launch the DSH web client with the overlay patch:

```bash
npx @deepseek-ai/dsh web --patch overlay.yml
```

> **Note**: the overlay only loads the Host entry. The Client UI (handwriting
> pad, screenshot OCR, LaTeX editor, settings page) will **not** appear because
> `dsh.client` is discovered through `node_modules`, which the overlay bypasses.
> For full UI testing, use the [link-based approach](#link-based-testing-recommended)
> above.

## Verification Checklist

Applies to the link-based approach (overlay only covers Host loading):

1. **"+" button** appears to the left of the input row
2. **Menu** opens on click with three items: Handwriting, Screenshot, LaTeX Editor
3. **Handwriting pad** modal renders, canvas accepts pointer drawing
4. **Settings section** appears in Settings with five controls (mode, beam, provider, debounce, language)
5. Changing a setting persists across page reload
6. **Preview strip** renders `\[x^2\]` typed in the composer as a KaTeX chip
7. **LaTeX editor dock** toggles from the menu, palette inserts snippets, Insert writes `\[...\]`

## Troubleshooting

- **Absolute path required**: the `name` field in `overlay.yml` must be an absolute path to `lib/index.js`

- **SharedArrayBuffer fallback**: if the server does not send `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers, ONNX Runtime falls back to single-threaded WASM — recognition still works but is slower

- **Model download**: first recognition triggers a \~7.2 MB download (encoder + decoder + vocab); subsequent loads use IndexedDB cache

- **WebGPU**: `provider: 'webgpu'` auto-detects and falls back to `wasm` on unsupported browsers
