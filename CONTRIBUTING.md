# Contributing

[中文](CONTRIBUTING.zh-CN.md) | **English**

Thanks for your interest in contributing! This guide covers source structure, local development, and the quality gate.

For end-to-end testing (build → overlay → DSH → verify), see
**[Local testing steps](README.md#local-testing)** in the README.

## Project structure

```
src/
├── index.ts                      # Host plugin entry — registers settings service
├── config.ts                     # Settings domain model + validation (zod)
├── config-schema.ts              # Host-only schemastery schema for settings
├── settings-service.ts           # Typert remote service: getSettings / updateSettings
├── typert.ts                     # Typert manifest contribution
├── remote.ts                     # Remote descriptors (mathInput namespace)
├── remote-contract.ts            # Zod schemas for wire types
├── strings.ts                    # UI locale strings (en / zh-CN)
├── latex/
│   ├── render.ts                 # LaTeX block detection + KaTeX rendering
│   └── repair.ts                 # LaTeX auto-repair heuristics
├── recognition/
│   ├── preprocess.ts             # Stroke model, bounds, noise filter
│   ├── image-preprocess.ts       # Image → tensor pipeline (grayscale, scale, pad, mask)
│   └── engine.ts                 # Recognition engine facade (ink-on lazy load, IndexedDB cache)
└── client/
    ├── index.tsx                 # Client plugin entry (slots, locale, settings)
    ├── ui-store.ts               # Shared UI state (modal open/close)
    ├── settings.tsx              # Settings section component
    ├── settings-controller.ts    # Settings controller (load, update, locale)
    ├── modal.tsx                 # Shared portal modal component
    ├── launcher.tsx              # "+" button menu (handwriting / screenshot / LaTeX editor)
    ├── handwriting-pad.tsx       # Handwriting pad with canvas and recognition
    ├── screenshot-ocr.tsx        # Screenshot OCR dialog
    ├── latex-editor.tsx          # LaTeX editor dock (Greek letters, templates, live preview)
    └── inline-renderer.tsx       # Inline LaTeX renderer for composer draft
```

Host modules (`settings-service.ts`, `config-schema.ts`) run on the Node side and are excluded from the client bundle. Client modules (`client/*.tsx`) run in the browser and use React + DSH UI slots.

Full architecture diagrams and design decisions are in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

## Development: testing and CI

Quality gate — all run locally:

```bash
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # ESLint 9 + typescript-eslint (flat config)
npm test            # Unit tests — node:test + tsx
npm run build       # tsdown + tsc → lib/
```

Tests live in `test/`, covering pure logic modules:

| Module | Test file | What it covers |
|---|---|---|
| `src/config.ts` | `test/config.test.ts` | Settings validation, defaults, patch merging |
| `src/latex/render.ts` | `test/latex-render.test.ts` | LaTeX block detection, closed/open block rules |
| `src/latex/repair.ts` | `test/latex-repair.test.ts` | LaTeX repair heuristics |
| `src/recognition/preprocess.ts` | `test/preprocess.test.ts` | Stroke bounds, noise filter, stroke sampling |
| `src/recognition/image-preprocess.ts` | `test/image-preprocess.test.ts` | Grayscale, invert, scale, pad, mask, line splitting, contrast normalization |
| `src/remote-contract.ts` | `test/remote-contract.test.ts` | Zod schema validation for wire types |

CI (`.github/workflows/ci.yml`) runs on push/PR across Node 20/22/24:
typecheck, lint, unit tests, build, and a check that the committed `lib/` matches the latest source.

### Why `lib/` is committed

This plugin is installed directly from GitHub (`dsh plugin add github:owner/repo`),
not from npm. DSH's plugin loader expects `lib/` to already exist — there is no
build step during install. So `lib/` must be committed and kept in sync with `src/`.

The CI `Verify committed lib/ is up to date` step catches drift automatically.

## Docs

- [Architecture — module layout, recognition pipeline, settings flow](docs/ARCHITECTURE.md)
- [Recognition engine — model, preprocessing, caching](docs/recognition-engine.md)
- [Local testing guide — overlay.yml setup and DSH launch](docs/local-testing.md)
- [Changelog](CHANGELOG.md)
