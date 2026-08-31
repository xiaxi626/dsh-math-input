import { useSyncExternalStore } from 'react'
import { DEFAULT_SETTINGS, type MathInputSettings, type MathInputSettingsPatch, type MathInputSettingsView } from '../config.js'
import type { MathInputRemote } from '../remote.js'

export type SettingsStatus = 'loading' | 'ready' | 'error'

export type SettingsSnapshot = {
  readonly status: SettingsStatus
  readonly view: MathInputSettingsView
  readonly detail: string
}

const EMPTY_VIEW: MathInputSettingsView = {
  available: false,
  writable: false,
  settings: { ...DEFAULT_SETTINGS },
  overridden: [],
}

type Listener = () => void

export class SettingsController {
  private snapshot: SettingsSnapshot = { status: 'loading', view: EMPTY_VIEW, detail: '' }
  private readonly listeners = new Set<Listener>()
  private disposed = false

  constructor(private readonly remote: MathInputRemote) {}

  readonly getSnapshot = (): SettingsSnapshot => this.snapshot

  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  async refreshSettings(): Promise<void> {
    const result = await this.remote.getSettings()
    if (this.disposed) return
    this.snapshot = result.ok
      ? { status: 'ready', view: result.value, detail: '' }
      : { status: 'error', view: EMPTY_VIEW, detail: result.error.message }
    this.emit()
  }

  async update(patch: MathInputSettingsPatch): Promise<boolean> {
    const result = await this.remote.updateSettings(patch)
    if (this.disposed) return false
    if (!result.ok) return false
    this.snapshot = { status: 'ready', view: result.value, detail: '' }
    this.emit()
    return true
  }

  dispose(): void {
    this.disposed = true
    this.listeners.clear()
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}

export function useSettingsSnapshot(controller: SettingsController): SettingsSnapshot {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot)
}

export type SettingsFace = {
  readonly status: SettingsStatus
  readonly settings: MathInputSettings
}
