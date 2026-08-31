import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { SettingsController } from './settings-controller.js';
type Translate = TranslateNS<'math-input'>;
export type SettingsSectionProps = {
    readonly close: () => void;
    readonly t: Translate;
    readonly settingsController: SettingsController;
};
export declare function MathInputSettingsSection({ settingsController, t }: SettingsSectionProps): import("react").JSX.Element;
export {};
