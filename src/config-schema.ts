import s from '@deepseek-ai/schemastery'
import { DEFAULT_SETTINGS } from './config.js'

export const MathInputSettingsSchema = s.object({
  recognitionMode: s.string().default(DEFAULT_SETTINGS.recognitionMode).description('Recognition vocabulary masking: auto | number | expression'),
  beamWidth: s.number().default(DEFAULT_SETTINGS.beamWidth).description('Beam search width: 1 (greedy) | 2 | 3 (best)'),
  executionProvider: s.string().default(DEFAULT_SETTINGS.executionProvider).description('ONNX execution provider: wasm | webgpu'),
  strokeDebounceSeconds: s.number().default(DEFAULT_SETTINGS.strokeDebounceSeconds).description('Pen idle seconds before auto recognition'),
  language: s.string().default(DEFAULT_SETTINGS.language).description('UI language override; empty follows the DSH locale'),
})
