import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { MathInputUiStore } from './ui-store.js';
import type { SettingsFace } from './settings-controller.js';
type Translate = TranslateNS<'math-input'>;
export type LauncherProps = {
    readonly input: {
        readonly draft: string;
    };
    readonly inputActions: {
        setDraft(text: string): void;
    };
    readonly t: Translate;
    readonly useSettings: () => SettingsFace;
    readonly uiStore: MathInputUiStore;
};
export declare function Launcher({ input, inputActions, t, useSettings, uiStore }: LauncherProps): import("react").JSX.Element;
export {};
