import { type Stroke } from './preprocess.js';
import type { TensorInput } from './image-preprocess.js';
import type { RecognitionMode, ExecutionProvider } from '../config.js';
export interface RecognitionResult {
    latex: string;
    score: number;
}
export interface RecognizeOptions {
    mode: RecognitionMode;
    beamWidth: number;
    provider: ExecutionProvider;
}
export interface MathRecognizer {
    recognizeStrokes(strokes: readonly Stroke[], options: RecognizeOptions): Promise<RecognitionResult[]>;
    recognizeTensor(input: TensorInput, options: RecognizeOptions): Promise<RecognitionResult[]>;
    dispose(): void;
}
export declare function pickValidLatex(results: readonly RecognitionResult[]): string | undefined;
export interface EngineSettingsLike {
    recognitionMode: RecognitionMode;
    beamWidth: number;
    executionProvider: ExecutionProvider;
}
export declare function recognizeOptionsFrom(settings: EngineSettingsLike): RecognizeOptions;
export declare function recognizeStrokes(recognizer: MathRecognizer, strokes: readonly Stroke[], options: RecognizeOptions): Promise<string | undefined>;
export declare function getSharedRecognizer(): MathRecognizer;
export declare function setSharedRecognizerForTests(recognizer: MathRecognizer | undefined): void;
