export type RecognitionMode = 'auto' | 'number' | 'expression'
export type ExecutionProvider = 'wasm' | 'webgpu'

export interface MathInputSettings {
  /** Vocabulary masking: auto (all), number (digits/operators), expression (math symbols). */
  recognitionMode: RecognitionMode
  /** Beam search width: 1 (greedy) | 2 | 3 (best quality). */
  beamWidth: number
  /** ONNX execution provider. */
  executionProvider: ExecutionProvider
  /** Seconds of pen idle before auto-recognition. */
  strokeDebounceSeconds: number
  /** UI language override; empty follows the DSH locale. */
  language: string
}

export type MathInputSettingsPatch = Partial<MathInputSettings>

export interface MathInputSettingsView {
  available: boolean
  writable: boolean
  settings: MathInputSettings
  overridden: string[]
}

export const DEFAULT_SETTINGS: MathInputSettings = Object.freeze({
  recognitionMode: 'auto',
  beamWidth: 3,
  executionProvider: 'wasm',
  strokeDebounceSeconds: 1.5,
  language: '',
})

const RECOGNITION_MODES: readonly RecognitionMode[] = ['auto', 'number', 'expression']
const EXECUTION_PROVIDERS: readonly ExecutionProvider[] = ['wasm', 'webgpu']
export const DEFAULT_DEBOUNCE_SECONDS = 1.5

export function isValidBeamWidth(value: number): boolean {
  return value === 1 || value === 2 || value === 3
}

export function isValidDebounceSeconds(value: number): boolean {
  return Number.isFinite(value) && value >= 0.3 && value <= 10
}

export function validateSettings(settings: MathInputSettings): void {
  if (!RECOGNITION_MODES.includes(settings.recognitionMode)) {
    throw new Error('dsh-math-input recognition mode must be auto, number, or expression')
  }
  if (!isValidBeamWidth(settings.beamWidth)) {
    throw new Error('dsh-math-input beam width must be 1, 2, or 3')
  }
  if (!EXECUTION_PROVIDERS.includes(settings.executionProvider)) {
    throw new Error('dsh-math-input execution provider must be wasm or webgpu')
  }
  if (!isValidDebounceSeconds(settings.strokeDebounceSeconds)) {
    throw new Error('dsh-math-input stroke debounce must be between 0.3 and 10 seconds')
  }
}

export function effectiveDebounceMs(settings: Pick<MathInputSettings, 'strokeDebounceSeconds'>): number {
  const seconds = isValidDebounceSeconds(settings.strokeDebounceSeconds)
    ? settings.strokeDebounceSeconds
    : DEFAULT_DEBOUNCE_SECONDS
  return Math.round(seconds * 1000)
}
