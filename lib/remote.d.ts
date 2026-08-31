import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
import type { MathInputSettingsPatch, MathInputSettingsView } from './remote-contract.js';
export type MathInputRemote = ClientRemote['mathInput'];
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespace$mathInput {
        getSettings: () => Promise<RemoteResult<MathInputSettingsView>>;
        updateSettings: (patch: MathInputSettingsPatch, signal?: AbortSignal) => Promise<RemoteResult<MathInputSettingsView>>;
    }
    interface TypertRemoteMap {
        'mathInput/getSettings': () => Promise<RemoteResult<MathInputSettingsView>>;
        'mathInput/updateSettings': (patch: MathInputSettingsPatch, signal?: AbortSignal) => Promise<RemoteResult<MathInputSettingsView>>;
    }
    interface TypertRemoteNamespaceMap {
        mathInput: TypertRemoteNamespace$mathInput;
    }
}
export declare const TYPERT_REMOTE: TypertRemoteContribution;
export default TYPERT_REMOTE;
