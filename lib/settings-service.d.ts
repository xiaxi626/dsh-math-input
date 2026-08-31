import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { type MathInputSettingsPatch, type MathInputSettingsView } from './config.js';
export declare const SETTINGS_NAMESPACE = "dsh-math-input";
export declare class MathInputSettingsService extends TypertRemoteService {
    static inject: never[];
    private settings;
    constructor(ctx: Context);
    getSettings(): MathInputSettingsView;
    updateSettings(patch: MathInputSettingsPatch, signal: AbortSignal): Promise<MathInputSettingsView>;
}
