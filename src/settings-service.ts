import type { Context } from '@deepseek-ai/cordis'
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import type { SettingsScope } from '@deepseek-ai/dsh-settings'
import { DEFAULT_SETTINGS, validateSettings, type MathInputSettings, type MathInputSettingsPatch, type MathInputSettingsView } from './config.js'
import { MathInputSettingsSchema } from './config-schema.js'

export const SETTINGS_NAMESPACE = 'dsh-math-input'

export class MathInputSettingsService extends TypertRemoteService {
  static inject = []
  private settings: SettingsScope<Record<string, unknown>> | undefined

  constructor(ctx: Context) {
    super(ctx, 'MathInput', { namespace: 'mathInput' })
    ctx.inject(['settings'], (settingsCtx) => {
      this.settings = settingsCtx.settings.register(settingsNamespace(SETTINGS_NAMESPACE), MathInputSettingsSchema, {
        validate: validateSettings as (value: unknown) => void,
      })
      settingsCtx.effect(() => () => {
        this.settings = undefined
      }, 'dsh-math-input settings lifecycle')
    })
  }

  getSettings(): MathInputSettingsView {
    if (this.settings === undefined) {
      return {
        available: false,
        writable: false,
        settings: { ...DEFAULT_SETTINGS },
        overridden: [],
      }
    }
    const provider = this.ctx.get('settings') as { writable?: boolean } | undefined
    return {
      available: true,
      writable: provider?.writable ?? false,
      settings: flattenStoredSettings(this.settings.get()),
      overridden: [],
    }
  }

  async updateSettings(patch: MathInputSettingsPatch, signal: AbortSignal): Promise<MathInputSettingsView> {
    if (this.settings === undefined) return this.getSettings()
    signal.throwIfAborted()
    const current = flattenStoredSettings(this.settings.get())
    const next: MathInputSettings = { ...current }
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) (next as unknown as Record<string, unknown>)[key] = value
    }
    validateSettings(next)
    await this.settings.update(next as unknown as Record<string, unknown>)
    return this.getSettings()
  }
}

function flattenStoredSettings(raw: unknown): MathInputSettings {
  const record = (typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>
  return {
    recognitionMode: record.recognitionMode === 'number' || record.recognitionMode === 'expression' ? record.recognitionMode : DEFAULT_SETTINGS.recognitionMode,
    beamWidth: record.beamWidth === 1 || record.beamWidth === 2 || record.beamWidth === 3 ? record.beamWidth : DEFAULT_SETTINGS.beamWidth,
    executionProvider: record.executionProvider === 'webgpu' ? 'webgpu' : DEFAULT_SETTINGS.executionProvider,
    strokeDebounceSeconds: typeof record.strokeDebounceSeconds === 'number' ? record.strokeDebounceSeconds : DEFAULT_SETTINGS.strokeDebounceSeconds,
    language: typeof record.language === 'string' ? record.language : DEFAULT_SETTINGS.language,
  }
}
