export type RecognitionMode = 'auto' | 'number' | 'expression';
export type ExecutionProvider = 'wasm' | 'webgpu';
export interface MathInputSettings {
    /** Vocabulary masking: auto (all), number (digits/operators), expression (math symbols). */
    recognitionMode: RecognitionMode;
    /** Beam search width: 1 (greedy) | 2 | 3 (best quality). */
    beamWidth: number;
    /** ONNX execution provider. */
    executionProvider: ExecutionProvider;
    /** Seconds of pen idle before auto-recognition. */
    strokeDebounceSeconds: number;
    /** UI language override; empty follows the DSH locale. */
    language: string;
}
export type MathInputSettingsPatch = Partial<MathInputSettings>;
export interface MathInputSettingsView {
    available: boolean;
    writable: boolean;
    settings: MathInputSettings;
    overridden: string[];
}
export declare const DEFAULT_SETTINGS: MathInputSettings;
export declare const DEFAULT_DEBOUNCE_SECONDS = 1.5;
export declare function isValidBeamWidth(value: number): boolean;
export declare function isValidDebounceSeconds(value: number): boolean;
export declare function validateSettings(settings: MathInputSettings): void;
export declare function effectiveDebounceMs(settings: Pick<MathInputSettings, 'strokeDebounceSeconds'>): number;
