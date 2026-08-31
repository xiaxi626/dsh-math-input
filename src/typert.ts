import { mathInputSettingsPatchSchema, mathInputSettingsViewSchema } from './remote-contract.js'

export const TYPERT = {
  package: 'dsh-math-input',
  face: 'host',
  schemas: [],
  invocations: [
    {
      id: 'dsh-math-input#mathInput/getSettings',
      service: 'MathInput',
      namespace: 'mathInput',
      method: 'getSettings',
      invocation: { kind: 'direct' },
      parameters: [],
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-math-input#MathInputSettingsView',
        schema: mathInputSettingsViewSchema,
      },
    },
    {
      id: 'dsh-math-input#mathInput/updateSettings',
      service: 'MathInput',
      namespace: 'mathInput',
      method: 'updateSettings',
      invocation: { kind: 'direct' },
      parameters: [{
        name: 'patch',
        wire: 'patch',
        source: 'json',
        codec: { mode: 'strict', typeSymbol: 'dsh-math-input#MathInputSettingsPatch', schema: mathInputSettingsPatchSchema },
      }],
      cancellation: { parameter: 'signal' },
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-math-input#MathInputSettingsView',
        schema: mathInputSettingsViewSchema,
      },
    },
  ],
  model: {
    services: [
      {
        description: 'Host-side settings persistence for the math input plugin.',
        summary: 'Math input settings service.',
        tags: [],
        jsDoc: '/** Host-side settings persistence for the math input plugin. */',
        key: 'MathInput',
        exportName: 'MathInputSettingsService',
        members: [
          { kind: 'method', name: 'getSettings', signature: 'getSettings(): MathInputSettingsView', summary: 'Read the current plugin settings.', jsDoc: '/** Read the current plugin settings. */' },
          { kind: 'method', name: 'updateSettings', signature: 'updateSettings(patch: MathInputSettingsPatch, signal: AbortSignal): Promise<MathInputSettingsView>', summary: 'Update plugin settings when the request has not been cancelled.', jsDoc: '/** Update plugin settings when the request has not been cancelled. */' },
        ],
        types: [
          { name: 'MathInputSettingsView', declaration: 'export interface MathInputSettingsView { available: boolean; writable: boolean; settings: MathInputSettings; overridden: string[] }' },
          { name: 'MathInputSettingsPatch', declaration: 'export type MathInputSettingsPatch = Partial<MathInputSettings>' },
        ],
      },
    ],
    events: [],
    objects: [],
  },
} as const

export default TYPERT
