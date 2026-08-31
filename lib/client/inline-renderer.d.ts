import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
type Translate = TranslateNS<'math-input'>;
export type InlineRendererProps = {
    readonly input: {
        readonly draft: string;
    };
    readonly inputActions: {
        setDraft(text: string): void;
    };
    readonly t: Translate;
};
export declare function InlineRendererStrip({ input, t }: InlineRendererProps): import("react").JSX.Element | null;
export {};
