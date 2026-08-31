# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## \[0.1.0] - unreleased

### Added

* Initial package scaffold: tsdown build pipeline, TypeScript configuration,
  ESLint setup, and placeholder entry points (`index`, `typert`, `remote`, `client`).

* Settings domain model (`config.ts`) with five user-tunable options:
  recognition mode, beam width, execution provider, stroke debounce, language.

* Host settings service (`settings-service.ts`) with schemastery schema
  (`config-schema.ts`), registered under namespace `dsh-math-input`.

* Typert/Remote contract triple: zod schemas (`remote-contract.ts`),
  manifest (`typert.ts`), and remote descriptors (`remote.ts`) for
  `getSettings` / `updateSettings` remote calls.

* LaTeX block detection and KaTeX rendering pipeline (`latex/render.ts`):
  detects `\(...\)` and `\[...\]` delimiters, renders to any DOM element.

* LaTeX auto-repair (`latex/repair.ts`): brace balancing, arity completion
  for `\frac` / `\sqrt`, and KaTeX-validity gate.

* Stroke model and noise filter (`recognition/preprocess.ts`): resampling,
  bounding-box computation, and dot/tap filtering via `isStrokeMeaningful`.

* Image preprocessing pipeline (`recognition/image-preprocess.ts`): RGBA to
  grayscale, white-on-black inversion, 64-px-aligned padding, and
  `Float32Array` tensor output for ONNX inference.

* Recognition engine facade (`recognition/engine.ts`): `pickValidLatex`
  candidate selector, `createInkOnRecognizer` with lazy model loading from
  GitHub releases, IndexedDB caching, and WebGPU-to-WASM auto-fallback.

* Client shell (`client/index.ts`): remote mount, locale registration,
  `settings.section` occupant, `conversation.input.left` launcher, and two
  `conversation.input.dock` occupants (preview strip + LaTeX editor).

* Bilingual UI strings (`client/strings.ts`) in `zh` and `en`, registered as
  the `math-input` locale namespace.

* Settings UI section (`client/settings.tsx`): five controls (mode, beam,
  provider, debounce, language) with live form rendering.

* Settings controller (`client/settings-controller.ts`): `useSyncExternalStore`
  state management with async refresh and optimistic update.

* Handwriting pad (`client/handwriting-pad.tsx`): canvas-based pointer
  capture, stroke debounce, KaTeX preview, and LaTeX source editing.

* Screenshot OCR window (`client/screenshot-ocr.tsx`): paste or upload image,
  convert to tensor, and run offline recognition.

* LaTeX editor dock (`client/latex-editor.tsx`): Greek-letter and template
  palette, live preview, and one-click `\[...\]` insertion into the composer.

* Inline renderer strip (`client/inline-renderer.tsx`): renders closed
  LaTeX blocks from the composer draft as KaTeX chips in real time.

* Shared modal component (`client/ui/modal.tsx`): portal-based overlay with
  Escape-to-close and backdrop-click dismiss.

* Cross-slot UI store (`client/ui-store.ts`): toggleable LaTeX editor dock
  state shared between launcher and dock occupants.

* GitHub Actions CI (`.github/workflows/ci.yml`): typecheck, lint, test, and
  build gates on Node 20/22/24, with committed-`lib` drift detection.

* Documentation: `docs/local-testing.md` (overlay smoke test guide) and
  `docs/recognition-engine.md` (CoMER model rationale and asset URLs).

