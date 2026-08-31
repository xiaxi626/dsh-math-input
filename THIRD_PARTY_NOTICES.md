# Third Party Notices

This file lists all third-party dependencies used by `dsh-math-input`, their licenses, and attribution notices as required by each license.

## Direct Dependencies

### ink-on

* **Purpose**: Handwritten math expression recognition (CoMER model, ONNX Runtime Web)

* **License**: Apache License 2.0

* **Copyright**: Copyright 2025 kimseungdae

* **Source**: <https://github.com/kimseungdae/ink-on>

* **npm**: <https://www.npmjs.com/package/ink-on>

Apache-2.0 is a permissive license. Conditions: preserve copyright and license notices, state changes. Licensed works, modifications, and larger works may be distributed under different terms. Commercial use, modification, distribution, patent use, and private use are permitted.

Full license text: <https://www.apache.org/licenses/LICENSE-2.0>

### katex

* **Purpose**: LaTeX rendering (inline renderer, preview, validation)

* **License**: MIT

* **Copyright**: Copyright (c) 2014-2025 Khan Academy & The KaTeX Contributors

* **Source**: <https://github.com/KaTeX/KaTeX>

* **npm**: <https://www.npmjs.com/package/katex>

Full license text: <https://opensource.org/licenses/MIT>

### onnxruntime-web

* **Purpose**: ONNX model inference runtime (WASM / WebGPU)

* **License**: MIT

* **Copyright**: Copyright (c) Microsoft Corporation

* **Source**: <https://github.com/microsoft/onnxruntime>

* **npm**: <https://www.npmjs.com/package/onnxruntime-web>

Full license text: <https://github.com/microsoft/onnxruntime/blob/main/LICENSE>

## Runtime-Downloaded Assets (not bundled in this package)

### CoMER ONNX Model Weights

* **Purpose**: Handwritten math recognition model (encoder + decoder, INT8 quantized, 7.2 MB total)

* **Provenance**: Derived from CoMER (Coverage-guided Multi-scale Encoder-decoder Transformer, ECCV 2022) by Wenqi Zhao (Green-Wood). Converted to ONNX format and published by ink-on.

* **Source repo**: <https://github.com/Green-Wood/CoMER> (archived, no explicit LICENSE file)

* **Download source**: <https://github.com/kimseungdae/ink-on/releases>

* **Training data**: CROHME handwritten math expression dataset (competition data, typically research-use)

* **License status**: The CoMER source repository does not include an explicit license file. The ink-on library code is Apache-2.0, but the model weights' licensing is not explicitly stated. This package does not bundle or redistribute the model files. Users download them at runtime from ink-on's GitHub releases. The model is included in the original CoMER repository as a public checkpoint.

**Note**: For strict commercial compliance, consider contacting the CoMER author for explicit permission, or substituting a model with a clear license (e.g., pix2tex, MIT).

## Optional Dependencies (not yet integrated)

### pix2tex (LaTeX-OCR)

* **Purpose**: Screenshot/image-to-LaTeX OCR (optional fallback for printed formula recognition)

* **License**: MIT

* **Copyright**: Copyright (c) 2021 Lukas Blecher

* **Source**: <https://github.com/lukas-blecher/LaTeX-OCR>

* **Training data**: im2latex-100k (Zenodo, open dataset)

Full license text: <https://github.com/lukas-blecher/LaTeX-OCR/blob/main/LICENSE>

## Platform Dependencies

### DeepSeek Harness (DSH) / Cordis

* **Purpose**: Plugin framework and runtime

* **License**: MIT

* **Source**: <https://github.com/deepseek-ai/deepseek-harness>

* **Third-party notices**: <https://github.com/deepseek-ai/deepseek-harness/blob/master/THIRD_PARTY_NOTICES.md>

## Dependencies to Avoid

### lia-canvas-ocr

* **License**: AGPL-3.0

* **Reason**: Strong copyleft license. Using AGPL-3.0 code would force the entire plugin to be distributed under a GPL-compatible license, conflicting with our MIT license goal. Do not use.

