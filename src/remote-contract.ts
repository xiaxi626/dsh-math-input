import { z } from 'zod'
import type { MathInputSettings, MathInputSettingsPatch, MathInputSettingsView } from './config.js'

export const textSchema = z.string()

export const mathInputSettingsSchema = z.object({
  recognitionMode: z.enum(['auto', 'number', 'expression']),
  beamWidth: z.number(),
  executionProvider: z.enum(['wasm', 'webgpu']),
  strokeDebounceSeconds: z.number(),
  language: z.string(),
})

export const mathInputSettingsPatchSchema = z.object({
  recognitionMode: z.enum(['auto', 'number', 'expression']).optional(),
  beamWidth: z.number().optional(),
  executionProvider: z.enum(['wasm', 'webgpu']).optional(),
  strokeDebounceSeconds: z.number().optional(),
  language: z.string().optional(),
})

export const mathInputSettingsViewSchema = z.object({
  available: z.boolean(),
  writable: z.boolean(),
  settings: mathInputSettingsSchema,
  overridden: z.array(z.string()),
})

export type MathInputSettingsWire = z.infer<typeof mathInputSettingsSchema>
export type MathInputSettingsPatchWire = z.infer<typeof mathInputSettingsPatchSchema>
export type MathInputSettingsViewWire = z.infer<typeof mathInputSettingsViewSchema>
export type { MathInputSettings, MathInputSettingsPatch, MathInputSettingsView }
