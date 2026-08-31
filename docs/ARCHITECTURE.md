# dsh-math-input — Architecture

**English** | [中文](./ARCHITECTURE.zh-CN.md)

A zero-token, fully offline math input plugin for DeepSeek Harness (DSH). It adds three input methods — handwriting recognition, screenshot OCR, and a LaTeX editor — plus inline LaTeX rendering inside the DSH composer. All recognition runs in the browser; no API key, no server round-trip, no token consumption.

> **Verification status (2026-08-31)**: every platform claim in this document was checked against first-party sources — `deepseek-harness` official docs (`docs/architecture.md`, `docs/subsystems/slots.md`, `docs/subsystems/typert.md`, `docs/subsystems/web-client.md`, `docs/subsystems/client-modules.md`, `docs/user/develop/basic/*`) and the complete source of `DIAG5/dsh-better-input` v0.1.8. Items still to resolve during implementation are collected in [Open Questions](#open-questions).

## Design Goals

| Goal                                     | How it is met                                                                                                                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zero token cost                          | Recognition runs entirely client-side via ONNX Runtime Web (WASM/WebGPU). The plugin never calls `ctx.llm`.                                                                                    |
| Fully offline after first model download | The CoMER model (7.2 MB total) is fetched once from GitHub Releases, then cached in IndexedDB. Subsequent loads are instant and require no network.                                            |
| Math-focused, not Chinese text           | The recognition engine (CoMER, trained on CROHME handwritten math) targets LaTeX symbols and expressions. Latin letters and math operators, not Chinese characters.                            |
| Consistent with dsh-better-input         | Mirrors the verified Client/Host/Typert/Remote structure, slot conventions, locale pattern, and build pipeline of `dsh-better-input` v0.1.8, with a thin Host because no LLM calls are needed. |

## Platform Integration (verified)

### Bundles, profiles, and layers

A running `dsh` is a Cordis plugin tree composed from ordered layers: each bundle in the profile, then the profile's `cordis.patch.yml`, then the home-level one, then any `--patch` overlay. `dsh plugin --profile web add dsh-math-input` installs this package into the profile home; the browser half is discovered through the package's `dsh.client` manifest, not through the Host entry.

Our `cordis.patch.yml` is therefore minimal (identical shape to dsh-better-input and dsh-skills-nexus):

```yaml
- insert:
    - id: dsh-math-input
      name: dsh-math-input
```

`package.json` declares `dsh.bundle.patch: "./cordis.patch.yml"` plus `dsh.client` (see [Client runtime](#client-runtime)).

### Host runtime

* Plugin entry exports `name` and `apply(ctx)` (function form). Dependencies declared in `inject` are ready before `apply` runs; everything registered through `ctx` is disposed automatically; explicit cleanup uses `ctx.effect(() => disposer)`.

* The Host registers one service: `MathInputSettingsService extends TypertRemoteService` (from `@deepseek-ai/dsh-typert-protocol`), mounted via `await ctx.plugin(MathInputSettingsService)` and constructed as `super(ctx, 'MathInput', { namespace: 'mathInput' })`. Each public method of the service becomes a Remote invocation.

* Settings persist through `@deepseek-ai/dsh-settings`: `ctx.settings.register(settingsNamespace('dsh-math-input'), MathInputSettingsSchema, { validate })`, where the schema is a Schemastery object with per-field defaults. The Host owns validation (`validateSettings`) and the flat stored shape.

* Typert gateway boundary rules (from dsh-better-input's hard-won comments): never assign explicit `undefined` in a returned object — omit optional keys instead; cancellation arrives as a trailing `signal: AbortSignal` parameter declared in the descriptor.

* No `ctx.llm` anywhere — zero token cost is architectural, not behavioral.

### Typert / Remote contract

Third-party plugins hand-write the three contract files (the harness's Typert codegen is internal to its own build):

| File                     | Content                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/remote-contract.ts` | Zod wire schemas + `z.infer` wire types for every parameter/result                                                                                |
| `src/typert.ts`          | `TYPERT` manifest: `{ package, face: 'host', schemas: [], invocations: [...], model: { services, events, objects } }` — one descriptor per method |
| `src/remote.ts`          | `TYPERT_REMOTE: TypertRemoteContribution` (client-facing descriptors) + `declare module '@deepseek-ai/dsh-typert-protocol'` augmentations         |

Descriptor shape per method: `id: 'dsh-math-input#mathInput/<method>'`, `service: 'MathInput'`, `namespace: 'mathInput'`, `invocation: { kind: 'direct' }`, ordered `parameters` (`{ name, wire, source: 'json', codec: { mode: 'strict', typeSymbol, schema } }`), optional `cancellation: { parameter: 'signal' }`, and a strict `result` codec.

For this thin plugin the contract exposes only settings I/O:

* `mathInput/getSettings() -> MathInputSettingsView`

* `mathInput/updateSettings(patch, signal?) -> MathInputSettingsView`

The Client mounts the contribution once with `await ctx.remote.$mount(TYPERT_REMOTE)` and calls `remote.getSettings()` etc., which resolve to `RemoteResult<T>` (`{ ok: true, value } | { ok: false, error }`).

### Client runtime

* `package.json` declares `dsh.client: { platform: 'web', inject: [...] }` listing the framework packages whose factories must arrive before ours materialize (mirrors dsh-better-input): `@deepseek-ai/dsh-client-runtime`, `@deepseek-ai/dsh-client-ui-conversation`, `@deepseek-ai/dsh-client-ui-slots`. The client bundle is exported at `exports['./client']`.

* The client entry (`src/client.ts` → `src/client/index.ts`) exports `inject: ['slots', 'remote', 'locale']` and `async apply(ctx: ClientContext): Promise<() => Promise<void>>`:

  1. `const disposeRemote = await ctx.remote.$mount(TYPERT_REMOTE)` — mounts `remote.mathInput`.
  2. `ctx.locale.register(MATH_INPUT_NS, { zh, en })` — bilingual dictionary registered before any slot renders.
  3. `await ctx.inject(['slots', 'remote', 'remote.mathInput', 'locale'], async (remoteCtx) => { ... slot registrations ... })` — the inner inject requests `remote.mathInput` only after the mount (requesting it in the outer inject deadlocks, since it gates our own activation).
  4. Returns a dispose function that disposes the locale dictionaries and the remote mount.

* Components are React 18 function components. They never receive `ctx`; everything arrives as props.

* CSS: inline styles keyed off DSH design tokens (`var(--dsw-alias-*)`); plugin keyframes injected via a `document.head` style tag carrying `dataset.plugin = 'dsh-math-input'`, removed on dispose.

### Slot map (verified against `docs/subsystems/slots.md` hierarchy)

| Our component       | Slot                           | Cardinality/scope | Placement notes                                                                                            |
| ------------------- | ------------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Launcher "+" button | `conversation.input.left`      | list / session    | Left of the composer input row. Fresh list id, low order.                                                  |
| Handwriting window  | React portal → `document.body` | n/a               | No modal slot exists; modal windows are portals (dsh-better-input uses portals for floating UI).           |
| Screenshot window   | React portal → `document.body` | n/a               | Same portal pattern.                                                                                       |
| LaTeX editor panel  | `conversation.input.dock`      | list / session    | Toggleable dock line above the composer (dsh-better-input occupies orders 15/20 here; we take a fresh id). |
| Settings page       | `settings.section`             | list / root       | `label` thunk via `ctx.locale.bind(NS)('settingsTitle')` so the sidebar row follows locale switches.       |
| Inline LaTeX render | composer draft (see below)     | n/a               | The composer draft is a plain string; see Component 6 and Open Questions.                                  |

Slot registration pattern (exactly dsh-better-input's):

```tsx
remoteCtx.slots.inject('conversation.input.dock', () =>
  remoteCtx.slots.register(
    { name: 'conversation.input.dock', id: 'math-input-latex-dock', order: 30, locale: MATH_INPUT_NS,
      inject: (sessionId) => ({ /* private face: controllers, callbacks */ }) },
    LatexEditorDock
  )
)
```

**Composer access**: components registered on session-scoped conversation slots receive framework props `input: { draft: string }` and `inputActions: { setDraft(text: string): void }` (plus `session`, `t`, and our injected face). All insertion paths funnel through `setDraft`: appending `\[latex\]` to the current draft is the entire write surface we need.

## Project Structure

```
dsh-math-input/
├── src/
│   ├── index.ts                  # Host entry: name + apply(ctx) -> ctx.plugin(MathInputSettingsService)
│   ├── config.ts                 # MathInputSettings interface, DEFAULT_SETTINGS, validators
│   ├── config-schema.ts          # Schemastery settings schema (Host-only, kept out of browser bundle)
│   ├── remote-contract.ts        # Zod wire schemas + wire types (shared)
│   ├── typert.ts                 # TYPERT manifest (host face)
│   ├── remote.ts                 # TYPERT_REMOTE contribution + module augmentations
│   ├── about.ts                  # installed package.json identity + update check (optional, pattern: dsh-better-input)
│   ├── client.ts                 # Client entry: re-exports src/client/index.ts
│   ├── client/
│   │   ├── index.ts              # client apply(): remote.$mount, locale.register, slots.inject registrations
│   │   ├── strings.ts            # typed zh/en dictionary for the 'math-input' locale namespace
│   │   ├── settings-controller.ts# external store over remote.getSettings/updateSettings + useSyncExternalStore hooks
│   │   ├── settings.tsx          # settings.section component (draft-on-change, save-on-blur)
│   │   ├── launcher.tsx          # "+" button in conversation.input.left + popup menu
│   │   ├── handwriting-pad.tsx   # portal modal: canvas, toolbar, recognition flow
│   │   ├── screenshot-ocr.tsx    # portal modal: paste/upload/capture -> recognition
│   │   ├── latex-editor.tsx      # conversation.input.dock panel: editor + palette + KaTeX preview
│   │   ├── inline-renderer.ts    # \[...\] detection in draft + rendered-block strategy (see Component 6)
│   │   └── ui/                   # shared modal frame, KaTeX preview pane, button styles
│   ├── recognition/
│   │   ├── engine.ts             # ink-on InferenceEngine singleton (lazy load + IndexedDB cache + Web Worker)
│   │   ├── preprocess.ts         # stroke preprocessing (reuses ink-on preprocessStrokes)
│   │   └── image-preprocess.ts   # screenshot image -> encoder tensor (grayscale / invert / scale to 256h)
│   └── latex/
│       ├── render.ts             # KaTeX rendering + \[...\] / $$...$$ detection
│       └── repair.ts             # brace balancing / argument fixing (reuses ink-on repairLatex)
├── test/                         # unit tests (node:test + tsx), pure-logic modules only
│   ├── latex-detect.test.ts
│   ├── latex-repair.test.ts
│   ├── preprocess.test.ts
│   ├── image-preprocess.test.ts
│   └── engine-mock.test.ts
├── docs/                         # ARCHITECTURE (en/zh), recognition-engine, local-testing
├── .github/workflows/ci.yml      # Node 20/22/24 matrix
├── lib/                          # build output (committed; CI checks it matches a fresh build)
├── cordis.patch.yml              # `- insert: [{ id, name }]`
├── tsdown.config.ts              # Host ESM/node entries: index, typert, remote (+ client bundle config)
├── tsdown.client.ts              # Client CJS/browser bundle wrapped in window.__ModuleLoader__.load(...)
├── tsconfig.json                 # strict, jsx react-jsx, noEmit (typecheck)
├── tsconfig.build.json           # declaration-only emit to lib/
├── eslint.config.js              # ESLint 9 flat config
├── package.json                  # dsh.bundle.patch + dsh.client + exports '.'/'./client'/'./typert'/'./remote'
├── README.md / README_CN.md
├── CONTRIBUTING.md / CONTRIBUTING.zh-CN.md
└── CHANGELOG.md
```

## Client / Host Architecture

**Host side** (`src/index.ts` + settings service): registers `MathInputSettingsService` (a `TypertRemoteService`), which owns the `dsh-math-input` settings namespace and exposes `getSettings` / `updateSettings`. No LLM calls, no `inject` beyond `settings`. This is the entire Host surface — recognition, rendering, and UI are all Client-resident.

**Client side** (`src/client/`): mounts the remote contribution, registers the locale dictionary, then registers slot occupants (launcher, dock panel, settings section) plus portal-rendered modal windows and the inline renderer. Runs the ONNX engine in a Web Worker.

**Contract** (`typert.ts` / `remote.ts` / `remote-contract.ts`): the minimal settings-only Typert surface described above. Compared with dsh-better-input (nine invocations routing LLM calls through the Host), ours has two.

## Recognition Engine

The plugin uses [`ink-on`](https://www.npmjs.com/package/ink-on), a framework-agnostic browser library for handwritten math expression recognition.

| Property         | Value                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| Model            | CoMER (Coverage-guided Multi-scale Encoder-decoder Transformer, ECCV 2022) |
| Runtime          | ONNX Runtime Web (WASM, optional WebGPU)                                   |
| Model size       | Encoder 3.4 MB + Decoder 4.0 MB = 7.2 MB total (INT8 quantized)            |
| Inference thread | Web Worker (off main thread, UI stays responsive)                          |
| Latency          | 1–2 seconds per recognition                                                |
| Caching          | IndexedDB — first download fetches 7.2 MB, subsequent loads are instant    |
| Dependencies     | `onnxruntime-web` (bundled into the client bundle), no Vue required        |

The engine exposes:

* `InferenceEngine` — loads ONNX sessions, runs encoder + decoder with beam search.

* `preprocessStrokes(strokes)` — resamples points at 3px intervals, renders Bezier curves on a white-on-black canvas, scales to height 256, converts to a grayscale Float32 tensor.

* `repairLatex(tokens)` — fixes unbalanced braces and broken `\frac`/`\sqrt` arguments, validated by KaTeX.

* `isStrokeMeaningful(strokes)` — filters accidental taps and dots.

* `loadVocab(url)` — loads the 245-symbol token vocabulary.

**Screenshot OCR reuse**: the same CoMER encoder accepts a preprocessed image tensor. A separate `image-preprocess.ts` converts a screenshot/pasted image to the same format (grayscale, inverted to white-on-black, scaled to height 256, 64px-aligned padding). This avoids shipping a second model. CoMER is trained on handwritten data (CROHME), so accuracy on printed formulas may be lower; if real-world testing shows insufficient results, a pix2tex ONNX export can be slotted in behind the same `recognize(input)` interface.

## Six Components

### 1. Inline LaTeX Renderer (`inline-renderer.ts`)

Watches the composer draft for `\[` ... `\]` closure pairs.

* State machine: `source` (editable text) <-> `rendered` (KaTeX block).

* Unclosed `\[` stays as plain text (no premature rendering).

* On send: rendered blocks expand back to `\[latex\]` plain text so the model reads the LaTeX source.

* The delimiter is `\[ ... \]` (pure LaTeX display math, no `$` ambiguity); `$$ ... $$` is detected too for pasted content, but plugin-produced output uses `\[...\]`.

**Framework constraint (verified)**: the composer draft is a plain string exposed through `input.draft` / `inputActions.setDraft`; the shipped slot system provides no hook to replace a text range with a React node inside the composer. v1 therefore renders a **KaTeX preview strip** (our own `conversation.input.dock` occupant showing live-rendered blocks for every closed pair in the draft; click a block to edit its source) instead of mutating composer DOM. True in-place rendering requires probing the composer DOM structure — tracked in [Open Questions](#open-questions), to be investigated during implementation.

### 2. Input Method Launcher (`launcher.tsx`)

A "+" button registered on `conversation.input.left` (verified: this slot exists in the shipped hierarchy, left of the input row). Clicking opens a popup menu (absolutely-positioned panel anchored to the button):

| Menu item                | Opens                             |
| ------------------------ | --------------------------------- |
| Handwriting input        | Component 3 (portal modal)        |
| Screenshot and recognize | Component 4 (portal modal)        |
| LaTeX syntax editor      | Component 5 (dock panel, toggled) |

### 3. Handwriting Window (`handwriting-pad.tsx`)

A React portal modal (fixed overlay on `document.body`), modeled on the AxMath writing pad.

**Toolbar** (left to right): settings, mode switch (auto / number / expression), eraser, clear, undo, submit-recognize, confirm, cancel.

**Canvas**: Pointer Events capture strokes (mouse, touch, and stylus unified). Strokes are stored as `Stroke[]` with Bezier-smoothed curves.

**Recognition flow**: a configurable debounce (default 1.5 s) after the last stroke -> `isStrokeMeaningful` filters noise -> `preprocessStrokes` normalizes -> Web Worker runs CoMER encoder + decoder -> `repairLatex` fixes common errors + KaTeX validation -> first valid candidate selected.

**Result area**: KaTeX live preview + editable LaTeX source. Confirm composes `\[latex\]` into the draft via `inputActions.setDraft` and closes the modal; the inline renderer then picks up the closed pair.

### 4. Screenshot OCR Window (`screenshot-ocr.tsx`)

A portal modal supporting three image sources: paste (Ctrl+V), file upload, and browser capture. After acquisition:

Image -> `image-preprocess` (grayscale, invert to white-on-black, scale to 256h, 64px-aligned padding) -> same CoMER encoder + decoder -> LaTeX -> KaTeX preview + editable -> confirm inserts `\[latex\]` via `setDraft`.

### 5. LaTeX Editor (`latex-editor.tsx`)

A `conversation.input.dock` occupant toggled by the launcher (collapsed by default; the dock slot keeps it co-present with the composer, same placement strategy as dsh-better-input's docks). Left: code editor area. Right: live KaTeX preview. Bottom: symbol palette modeled on the AxMath bottom toolbar.

* Greek letter row: alpha, beta, gamma, delta, theta, lambda, mu, pi, sigma, phi, omega, etc.

* Structure template row: `\frac{}{}`, `\sqrt{}`, `\sum_{}^{}`, `\int_{}^{}`, `x^{}`, `x_{}`, matrix templates.

* Clicking a palette item inserts the corresponding LaTeX fragment at the cursor.

Confirm inserts `\[latex\]` into the draft via `setDraft`.

### 6. Settings Page (`settings.tsx`)

A `settings.section` occupant (list cardinality, root scope) with a locale-bound sidebar label. Props: `{ close, t, settingsController }`. Configurable options:

| Setting               | Options                                                    |
| --------------------- | ---------------------------------------------------------- |
| Recognition mode      | auto / number / expression (vocabulary masking)            |
| Beam width            | 1 (greedy, fastest) / 2 / 3 (default, best quality)        |
| Execution provider    | wasm (default) / webgpu (auto-detected, 2–5x faster)       |
| Stroke debounce delay | seconds (default 1.5)                                      |
| Model cache           | show IndexedDB status / clear cache / re-download (7.2 MB) |
| Interface language    | Chinese / English (follows DSH via `ctx.locale`)           |

Pattern: `SettingsController` external store over `remote.getSettings/updateSettings`, observed with `useSyncExternalStore`; fields edit a local draft and save on blur/change; the Host validates via `validateSettings` and rejects invalid patches.

## Data Flow

### Handwriting path

```
Pointer Events -> Canvas Stroke[]
  -> ink-on preprocessStrokes (resample, Bezier, scale to 256h)
  -> Web Worker: CoMER encoder -> decoder (ONNX WASM, ~1-2s)
  -> repairLatex (brace balancing, KaTeX validation)
  -> LaTeX string + KaTeX preview
  -> user confirms
  -> inputActions.setDraft(draft + \[latex\])
  -> inline-renderer detects closure -> preview strip renders
```

### Screenshot path

```
paste / upload / capture -> ImageBitmap
  -> image-preprocess (grayscale, invert, scale to 256h, padding)
  -> same CoMER encoder -> decoder
  -> LaTeX + KaTeX preview -> confirm -> setDraft -> inline render
```

### LaTeX editor path

```
keyboard input / palette click -> LaTeX string
  -> KaTeX live preview (per keystroke)
  -> confirm -> setDraft -> inline render
```

## Build

Two-phase build, mirroring dsh-better-input exactly:

1. **`tsdown`** — two configs:

   * Host: entries `{ index, typert, remote }` from `src/`, `format: 'esm'`, `platform: 'node'`, `target: 'es2022'`, sourcemaps.

   * Client: entry `{ client: 'src/client.ts' }`, `format: 'cjs'`, `platform: 'browser'`, with `outputOptions` `banner/footer` wrapping the bundle in `window.__ModuleLoader__.load({ id: 'dsh-math-input', factory: (require) => { ... return module.exports } })`. Externals (`react`, `react/jsx-runtime`, `react-dom`, `@deepseek-ai/cordis`, and the `@deepseek-ai/dsh-client-*` framework packages) are resolved by the DSH module loader's `require`; **everything else is bundled** — including `katex`, `onnxruntime-web`, and `ink-on`.
2. **`tsc -p tsconfig.build.json`** — declaration-only emit into `lib/`.

`lib/` is committed (same convention as dsh-skills-nexus / dsh-better-input); CI re-builds and fails on drift. `package.json` `exports` maps `.`, `./client`, `./typert`, `./remote`; `files` ships `lib/` + `cordis.patch.yml` + README/LICENSE.

Peer dependencies (provisioned by the DSH web app at runtime): `@deepseek-ai/cordis ^4.x`, `@deepseek-ai/dsh-client-runtime`, `dsh-client-ui-conversation`, `dsh-client-ui-slots`, `dsh-client-locale`, `dsh-settings`, `dsh-typert-protocol`, `dsh-api-remotes`, `@deepseek-ai/schemastery ^3.18`, `zod ^4`. Dev/runtime: `react 18`, `tsdown`, `typescript`, `katex`, `ink-on`, `onnxruntime-web`.

## Testing and CI

### Quality gates (local)

```
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # ESLint 9 flat config
npm test            # node:test + tsx, no extra framework
npm run build       # tsdown && tsc -p tsconfig.build.json -> lib/
```

### Unit tests

Tests live in `test/` and target pure-logic modules. No real ONNX model is loaded — the engine is mocked.

| Test file                  | What it verifies                                                                 |
| -------------------------- | -------------------------------------------------------------------------------- |
| `latex-detect.test.ts`     | `\[...\]` closure detection, unclosed delimiter stays plain, nesting             |
| `latex-repair.test.ts`     | brace balancing, `\frac`/`\sqrt` argument fixing, KaTeX validation               |
| `preprocess.test.ts`       | stroke resampling interval, tensor shape (256 x 64-aligned), empty stroke filter |
| `image-preprocess.test.ts` | image -> grayscale / invert / scale / padding shape correctness                  |
| `engine-mock.test.ts`      | mock InferenceEngine returns -> candidate selection logic                        |

### CI (`.github/workflows/ci.yml`)

Triggers on push and pull request. Matrix across Node 20 / 22 / 24. Runs: typecheck -> lint -> unit tests -> build. Also checks that the committed `lib/` still matches a fresh build (prevents drift).

### Local testing (two install modes)

**Overlay (fast iteration)** — against any `dsh web` installation:

1. `npm install && npm run build` (generates `lib/`).
2. Create `overlay.yml` inserting the built Host entry by **absolute path**:

   ```yaml
   - insert:
       - id: dsh-math-input
         name: '/abs/path/to/dsh-math-input/lib/index.js'
   ```
3. `npx @deepseek-ai/dsh web --patch overlay.yml` — the patch layer mounts the plugin; the client half is discovered via the package's `dsh.client` manifest (a patch file does not change the profile directory from which the loader resolves module paths, hence the absolute path).
4. Verify the "+" button, the three input surfaces, and the settings section in the DSH web UI (default `http://127.0.0.1:3080`).

**Installed plugin**:

1. Push to GitHub.
2. `dsh plugin --profile web add github:<owner>/dsh-math-input` (or the npm name once published).
3. Restart the profile; verify the same functionality.

## Key Technical Decisions

| Decision           | Choice                                                                                   | Rationale                                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recognition engine | `ink-on` (CoMER, browser ONNX)                                                           | Zero token, tiny model (7.2 MB), framework-agnostic core, LaTeX auto-repair built in. Trained on handwritten math, matching the use case.                           |
| Screenshot OCR     | Reuse CoMER (one model)                                                                  | Avoids shipping a second model. If printed-formula accuracy is insufficient, swap in pix2tex ONNX behind the same interface.                                        |
| Model hosting      | Download from ink-on GitHub Releases + IndexedDB cache                                   | No self-hosted CDN needed. First load fetches 7.2 MB; subsequent loads are instant.                                                                                 |
| LaTeX delimiter    | `\[ ... \]` (primary), `$$ ... $$` (compatible detection)                                | Pure LaTeX, no `$` ambiguity, model-native. Renderer also detects `$$` for pasted content.                                                                          |
| Launcher placement | `conversation.input.left` slot                                                           | Verified in the shipped slot hierarchy; no CSS hacks needed (the earlier draft's `conversation.input.right` fallback is obsolete).                                  |
| Window form factor | Handwriting/screenshot: portal modals. LaTeX editor: `conversation.input.dock` occupant. | No modal slot exists in DSH; portals to `document.body` are the established pattern for floating plugin UI. The dock keeps the editor co-present with the composer. |
| Composer writes    | `inputActions.setDraft` only                                                             | Verified write surface on session-scoped input slots; no composer DOM mutation in v1.                                                                               |
| Inline rendering   | v1: dock preview strip over closed pairs; in-place rendering deferred                    | The composer draft is a plain string; replacing ranges with React nodes is not supported by the slot system. See Open Questions.                                    |
| Host thickness     | Thin: settings-only `TypertRemoteService` (2 invocations)                                | All recognition is browser-side. No `ctx.llm`, no `inject` beyond `settings`.                                                                                       |
| Contract style     | Hand-written typert/remote/remote-contract trio + zod                                    | Harness Typert codegen is internal; dsh-better-input proves the hand-written pattern ships fine.                                                                    |
| Build toolchain    | tsdown (Host ESM + wrapped Client CJS) + tsc declarations                                | Required by the `window.__ModuleLoader__` client packaging; plain tsc cannot produce the wrapped client bundle.                                                     |
| Test framework     | `node:test` + tsx                                                                        | No extra dependency, matches dsh-skills-nexus convention.                                                                                                           |

## Open Questions

To resolve during implementation (edge-work, per plan agreement):

1. **Composer DOM for true inline rendering** — v1 ships the dock preview strip. During implementation, inspect the live composer DOM (via browser devtools against a running `dsh web`) to judge whether a safe, version-tolerant in-place render (e.g., an overlay layer keyed to draft offsets) is feasible without fighting the framework.
2. **ink-on release asset URLs** — exact encoder/decoder/vocab artifact URLs and checksums to pin in `engine.ts`; verify the 7.2 MB size claim and WebGPU provider availability on current `onnxruntime-web`.

## Compatibility

* DeepSeek Harness `>= 0.1.1-rc.2` (Web profile); client packages developed against `@deepseek-ai/dsh-client-*` `0.1.0-rc.8` peer ranges (`>=0.0.1-rc.1 <0.1.0 || >=0.1.0-rc.1 <0.2.0-0`).

* Node.js `>= 20.0.0` for building (harness itself targets 22.19+/24+).

* Chromium-based browser (Chrome / Edge) for ONNX WASM + WebGPU.

* SharedArrayBuffer requires COOP/COEP headers for multi-threaded WASM (falls back to single-threaded without them).

## License

The plugin code is licensed under **MIT**.

Third-party dependencies and their licenses are documented in [THIRD\_PARTY\_NOTICES.md](../THIRD_PARTY_NOTICES.md). Summary:

* **ink-on** (recognition engine): Apache-2.0 — permissive, compatible with MIT. Conditions: preserve copyright and license notices, state changes.

* **KaTeX** (LaTeX rendering): MIT.

* **onnxruntime-web** (inference runtime): MIT.

* **DSH / Cordis** (plugin framework): MIT.

* **CoMER model weights** (downloaded at runtime, not bundled): no explicit license in the source repository. See THIRD\_PARTY\_NOTICES.md for provenance and risk assessment.

* **pix2tex** (optional screenshot OCR fallback): MIT.

Avoid: **lia-canvas-ocr** (AGPL-3.0) — strong copyleft would force the entire plugin to GPL.

## Research Sources

This document was verified against (2026-08-31):

* `deepseek-ai/deepseek-harness` @ master: `docs/architecture.md`, `docs/development.md`, `docs/subsystems/slots.md`, `docs/subsystems/typert.md`, `docs/subsystems/web-client.md`, `docs/subsystems/client-modules.md`, `docs/user/develop/basic/{index,config}.md`.

* `DIAG5/dsh-better-input` @ v0.1.8 (complete source): `package.json`, `cordis.patch.yml`, `src/index.ts`, `src/config.ts`, `src/config-schema.ts`, `src/remote-contract.ts`, `src/typert.ts`, `src/remote.ts`, `src/about.ts`, `src/polish/service.ts`, `src/client.ts`, `src/client/{index,settings,settings-controller,strings}.ts(x)`, `src/client/{MicrophoneButton,OptimizeButton,VoiceRecognitionBar,conversion-controller}.ts(x)`, `tsdown.config.ts`, `tsdown.client.ts`, `tsconfig{,.build}.json`.

