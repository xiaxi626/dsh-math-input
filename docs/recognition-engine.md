# Recognition Engine

## Model Choice: CoMER (via ink-on)

The recognition engine uses **CoMER** (Coverage Maximization ExtRactor), a Transformer-based model trained on the CROHME handwritten math expression dataset. The model is packaged as INT8-quantized ONNX (7.2 MB total: 3.4 MB encoder + 4.0 MB decoder).

### Why CoMER over pix2tex

| Criterion | CoMER (ink-on) | pix2tex |
|---|---|---|
| Training data | CROHME (handwritten) | Printed formulas |
| Model size | 7.2 MB (INT8) | ~50 MB |
| License | Apache-2.0 | AGPL-3.0 |
| Browser inference | ONNX Runtime Web | PyTorch (impractical) |

CoMER is handwritten-first, matching the primary use case. pix2tex is trained on printed formulas and would underperform on handwriting.

## ink-on Library

[ink-on](https://github.com/kimseungdae/ink-on) v0.1.0 is a framework-agnostic, browser-only math recognition library:

- **License**: Apache-2.0
- **Core**: framework-agnostic (works with React, Svelte, vanilla JS)
- **Built-in repair**: brace balancing, arity completion, KaTeX validation
- **IndexedDB cache**: models cached locally after first download

### Pinned Assets

| File | URL | Size |
|---|---|---|
| encoder_int8.onnx | `https://github.com/kimseungdae/ink-on/releases/download/v0.1.0/encoder_int8.onnx` | 3.4 MB |
| decoder_int8.onnx | `https://github.com/kimseungdae/ink-on/releases/download/v0.1.0/decoder_int8.onnx` | 4.0 MB |
| vocab.json | `https://github.com/kimseungdae/ink-on/releases/download/v0.1.0/vocab.json` | 4 KB |

## Printed-Formula Fallback

Printed formula screenshots (OCR path) may underperform with CoMER. A future pix2tex fallback can be wired behind the same `MathRecognizer` interface — the engine facade in `src/recognition/engine.ts` isolates UI code from the backend choice.

## AGPL Exclusion

`lia-canvas-ocr` was excluded due to AGPL-3.0 licensing incompatibility. The ink-on + CoMER path provides full browser-side recognition under permissive licenses.
