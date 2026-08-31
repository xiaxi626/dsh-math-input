import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { MathInputUiStore } from './ui-store.js';
type Translate = TranslateNS<'math-input'>;
export type LatexEditorDockProps = {
    readonly input: {
        readonly draft: string;
    };
    readonly inputActions: {
        setDraft(text: string): void;
    };
    readonly t: Translate;
    readonly uiStore: MathInputUiStore;
};
export declare function LatexEditorDock({ input, inputActions, t, uiStore }: LatexEditorDockProps): import("react").JSX.Element | null;
export {};
