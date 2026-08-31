import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import { mathInputSettingsPatchSchema, mathInputSettingsViewSchema } from './remote-contract.js'
import type { MathInputSettingsPatch, MathInputSettingsView } from './remote-contract.js'

export type MathInputRemote = ClientRemote['mathInput']

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespace$mathInput {
    getSettings: () => Promise<RemoteResult<MathInputSettingsView>>
    updateSettings: (patch: MathInputSettingsPatch, signal?: AbortSignal) => Promise<RemoteResult<MathInputSettingsView>>
  }

  interface TypertRemoteMap {
    'mathInput/getSettings': () => Promise<RemoteResult<MathInputSettingsView>>
    'mathInput/updateSettings': (patch: MathInputSettingsPatch, signal?: AbortSignal) => Promise<RemoteResult<MathInputSettingsView>>
  }

  interface TypertRemoteNamespaceMap {
    mathInput: TypertRemoteNamespace$mathInput
  }
}

export const TYPERT_REMOTE: TypertRemoteContribution = {
  package: 'dsh-math-input',
  descriptors: [
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
}

export default TYPERT_REMOTE
