/** Bilingual UI strings, registered as one namespace into the DSH locale runtime. */
export type MathInputStrings = {
    settingsTitle: string;
    settingsDescription: string;
    loading: string;
    saveFailed: string;
    recognitionModeLabel: string;
    recognitionModeHint: string;
    modeAuto: string;
    modeNumber: string;
    modeExpression: string;
    beamWidthLabel: string;
    beamWidthHint: string;
    providerLabel: string;
    providerHint: string;
    debounceLabel: string;
    debounceHint: string;
    languageLabel: string;
    languageHint: string;
    languagePlaceholder: string;
    launcherTitle: string;
    menuHandwriting: string;
    menuScreenshot: string;
    menuLatexEditor: string;
    padTitle: string;
    padRecognizing: string;
    padConfirm: string;
    padCancel: string;
    padClear: string;
    padUndo: string;
    padResultLabel: string;
    padSourcePlaceholder: string;
    padError: string;
    ocrTitle: string;
    ocrPasteHint: string;
    ocrUpload: string;
    ocrWarning: string;
    editorTitle: string;
    editorInsert: string;
    previewTitle: string;
};
export declare const MATH_INPUT_NS = "math-input";
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'math-input': keyof MathInputStrings;
    }
}
export declare const zh: MathInputStrings;
export declare const en: MathInputStrings;
