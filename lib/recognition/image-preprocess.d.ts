export declare const MODEL_H = 256;
export declare const TARGET_H = 128;
export declare const MAX_W = 1024;
export declare const MIN_W = 128;
export declare const W_ALIGN = 64;
export declare const PAD = 16;
export declare const TARGET_HEIGHT = 256;
export declare const ALIGNMENT = 64;
export interface ImageLike {
    width: number;
    height: number;
    data: Uint8ClampedArray;
}
export interface GrayImage {
    width: number;
    height: number;
    values: Float32Array;
}
export interface TensorInput {
    tensor: Float32Array;
    height: number;
    width: number;
    mask: Uint8Array;
    maskHeight: number;
    maskWidth: number;
}
export declare function toGrayscaleFloat(image: ImageLike): Float32Array;
export declare function invert(values: Float32Array): Float32Array;
export declare function scaleToHeight(values: Float32Array, width: number, height: number, targetHeight: number): GrayImage;
export declare function padToMultiple(values: Float32Array, width: number, height: number, multiple: number): GrayImage;
export declare function imageToTensor(image: ImageLike): TensorInput;
export declare function splitIntoLines(image: ImageLike, gapThreshold?: number): ImageLike[];
