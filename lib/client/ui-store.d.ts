type Listener = () => void;
export declare class MathInputUiStore {
    latexDockOpen: boolean;
    private readonly listeners;
    readonly subscribe: (listener: Listener) => (() => void);
    readonly getLatexDockOpen: () => boolean;
    toggleLatexDock(): void;
    private emit;
}
export {};
