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

const MODEL_BASE = 'https://github.com/kimseungdae/ink-on/releases/download/v0.1.0'
const ENCODER_URL = `${MODEL_BASE}/encoder_int8.onnx`
const DECODER_URL = `${MODEL_BASE}/decoder_int8.onnx`
const VOCAB_URL = `${MODEL_BASE}/vocab.json`

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
      const inkOn = await import('ink-on/core')
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
      const inkOn = await import('ink-on/core')
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
