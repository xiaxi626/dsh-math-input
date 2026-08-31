# Local Testing

## Prerequisites

- Node.js >= 20
- Chrome or Edge (for WebGPU support and SharedArrayBuffer)

## Install

```bash
npm install
npm run build
```

## Overlay Smoke Test

Create `overlay.yml` in the project root:

```yaml
- insert:
    - id: dsh-math-input
      name: 'C:/Users/asswsw/Downloads/dsh-math-input/lib/index.js'
```

Launch the DSH web client with the overlay patch:

```bash
npx -y @deepseek-ai/dsh web --patch overlay.yml
```

Open `http://127.0.0.1:3080`.

If the web profile deps are missing (the DSH web profile was never installed), run:

```bash
npx -y @deepseek-ai/dsh plugin --profile web list
```

Then retry the overlay command.

## Verification Checklist

1. **"+" button** appears to the left of the input row
2. **Menu** opens on click with three items: Handwriting, Screenshot, LaTeX Editor
3. **Handwriting pad** modal renders, canvas accepts pointer drawing
4. **Settings section** appears in Settings with five controls (mode, beam, provider, debounce, language)
5. Changing a setting persists across page reload
6. **Preview strip** renders `\[x^2\]` typed in the composer as a KaTeX chip
7. **LaTeX editor dock** toggles from the menu, palette inserts snippets, Insert writes `\[...\]`

## Troubleshooting

- **Absolute path required**: the `name` field in `overlay.yml` must be an absolute path to `lib/index.js`
- **Profile initialization**: if `dsh web` fails to start, run `npx -y @deepseek-ai/dsh plugin --profile web list` first
- **SharedArrayBuffer fallback**: if the server does not send `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers, ONNX Runtime falls back to single-threaded WASM — recognition still works but is slower
- **Model download**: first recognition triggers a ~7.2 MB download (encoder + decoder + vocab); subsequent loads use IndexedDB cache
- **WebGPU**: `provider: 'webgpu'` auto-detects and falls back to `wasm` on unsupported browsers
