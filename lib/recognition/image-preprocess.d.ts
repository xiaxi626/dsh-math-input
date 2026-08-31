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
export declare function toGrayscaleFloat(image: ImageLike): Float32Array;
export declare function invert(values: Float32Array): Float32Array;
export declare function scaleToHeight(values: Float32Array, width: number, height: number, targetHeight: number): GrayImage;
export declare function padToMultiple(values: Float32Array, width: number, height: number, multiple: number): GrayImage;
/** Screenshot/pasted image -> CoMER encoder input (white ink on black, 256h, 64-aligned). */
export declare function imageToTensor(image: ImageLike): GrayImage;
