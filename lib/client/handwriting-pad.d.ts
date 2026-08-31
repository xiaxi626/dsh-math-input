import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { type MathInputSettings } from '../config.js';
type Translate = TranslateNS<'math-input'>;
export type HandwritingPadProps = {
    readonly t: Translate;
    readonly settings: MathInputSettings;
    readonly onClose: () => void;
    readonly onInsert: (latex: string) => void;
};
export declare function HandwritingPad({ t, settings, onClose, onInsert }: HandwritingPadProps): import("react").JSX.Element;
export {};
