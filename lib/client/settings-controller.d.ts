import { type MathInputSettings, type MathInputSettingsPatch, type MathInputSettingsView } from '../config.js';
import type { MathInputRemote } from '../remote.js';
export type SettingsStatus = 'loading' | 'ready' | 'error';
export type SettingsSnapshot = {
    readonly status: SettingsStatus;
    readonly view: MathInputSettingsView;
    readonly detail: string;
};
type Listener = () => void;
export declare class SettingsController {
    private readonly remote;
    private snapshot;
    private readonly listeners;
    private disposed;
    constructor(remote: MathInputRemote);
    readonly getSnapshot: () => SettingsSnapshot;
    readonly subscribe: (listener: Listener) => (() => void);
    refreshSettings(): Promise<void>;
    update(patch: MathInputSettingsPatch): Promise<boolean>;
    dispose(): void;
    private emit;
}
export declare function useSettingsSnapshot(controller: SettingsController): SettingsSnapshot;
export type SettingsFace = {
    readonly status: SettingsStatus;
    readonly settings: MathInputSettings;
};
export {};
