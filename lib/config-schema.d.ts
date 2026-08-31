import s from '@deepseek-ai/schemastery';
export declare const MathInputSettingsSchema: s<Schemastery.ObjectS<{
    recognitionMode: s<string, string>;
    beamWidth: s<number, number>;
    executionProvider: s<string, string>;
    strokeDebounceSeconds: s<number, number>;
    language: s<string, string>;
}>, Schemastery.ObjectT<{
    recognitionMode: s<string, string>;
    beamWidth: s<number, number>;
    executionProvider: s<string, string>;
    strokeDebounceSeconds: s<number, number>;
    language: s<string, string>;
}>>;
