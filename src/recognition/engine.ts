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

export function getSharedRecognizer(): MathRecognizer {
  if (shared === undefined) shared = createInkOnRecognizer()
  return shared
}

export function setSharedRecognizerForTests(recognizer: MathRecognizer | undefined): void {
  shared = recognizer
}

const MODEL_BASE = 'https://cdn.jsdelivr.net/gh/kimseungdae/ink-on@v0.1.0/public/models/comer'
const ENCODER_URL = `${MODEL_BASE}/encoder_int8.onnx`
const DECODER_URL = `${MODEL_BASE}/decoder_int8.onnx`
const VOCAB_URL = `${MODEL_BASE}/vocab.json`
const WASM_PATH = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.29.0/dist/'

/**
 * Lazily resolve the `ink-on/core` module exactly once and reuse the promise.
 *
 * The recognizer used to call `await import('ink-on/core')` on every single
 * recognition pass — redundant work that also needlessly re-enters the module
 * loader. Because the build inlines this dynamic import (codeSplitting: false)
 * the inlined `Promise.resolve().then(...)` is cheap, but resolving it once is
 * still cleaner and avoids any provider that might re-evaluate the namespace.
 *
 * We keep this as a cached *dynamic* import rather than a top-level static
 * import deliberately: engine.ts is imported by the test suite (which only uses
 * `pickValidLatex`), and a static import would eagerly pull `onnxruntime-web`
 * into Node. Deferring the load keeps that heavyweight browser dependency out
 * of code paths that never actually run recognition.
 */
type InkOnModule = typeof import('ink-on/core')
let inkOnModulePromise: Promise<InkOnModule> | undefined

function loadInkOn(): Promise<InkOnModule> {
  if (inkOnModulePromise === undefined) inkOnModulePromise = import('ink-on/core')
  return inkOnModulePromise
}

interface InkOnEngine {
  recognize(input: { tensor: Float32Array; height: number; width: number; mask: Uint8Array; maskHeight: number; maskWidth: number }, vocab: unknown, mode?: string): Promise<{ latex: string; tokenIds: number[]; totalMs: number }>
  dispose(): void
}

interface InkOnVocab {
  word2idx: Record<string, number>
  idx2word: Record<string, string>
  special_tokens: { pad: number; sos: number; eos: number }
  vocab_size: number
}

function createInkOnRecognizer(): MathRecognizer {
  let engine: InkOnEngine | undefined
  let vocab: InkOnVocab | undefined
  let initPromise: Promise<void> | undefined

  const ensureReady = async (options: RecognizeOptions): Promise<void> => {
    if (engine !== undefined && vocab !== undefined) return
    if (initPromise !== undefined) { await initPromise; return }
    initPromise = (async () => {
      const ort = await import('onnxruntime-web')
      ort.env.wasm.wasmPaths = WASM_PATH
      const inkOn = await loadInkOn()
      const provider = options.provider === 'webgpu' && typeof navigator !== 'undefined' && 'gpu' in navigator
        ? 'webgpu'
        : 'wasm'
      const e = new inkOn.InferenceEngine({
        encoderUrl: ENCODER_URL,
        decoderUrl: DECODER_URL,
        beamWidth: options.beamWidth,
        executionProvider: provider,
      })
      await e.init()
      engine = e as unknown as InkOnEngine
      vocab = await inkOn.loadVocab(VOCAB_URL) as InkOnVocab
    })()
    await initPromise
  }

  return {
    async recognizeStrokes(strokes, options) {
      await ensureReady(options)
      const inkOn = await loadInkOn()
      const inkOnStrokes = strokes.map(s => ({ points: s.points, lineWidth: 2.5 }))
      const input = inkOn.preprocessStrokes(inkOnStrokes)
      const result = await engine!.recognize(input, vocab!, options.mode)
      return [{ latex: result.latex, score: 1 }]
    },

    async recognizeTensor(tensor, width, height, options) {
      await ensureReady(options)
      const input = {
        tensor,
        height,
        width,
        mask: new Uint8Array(width * height),
        maskHeight: height,
        maskWidth: width,
      }
      const result = await engine!.recognize(input, vocab!, options.mode)
      return [{ latex: result.latex, score: 1 }]
    },

    dispose() {
      engine?.dispose()
      engine = undefined
      vocab = undefined
      initPromise = undefined
    },
  }
}
