export interface StrokePoint {
    x: number;
    y: number;
}
export interface Stroke {
    points: StrokePoint[];
}
export interface StrokeBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
}
export declare function strokeBounds(strokes: readonly Stroke[]): StrokeBounds | undefined;
export declare function isStrokeMeaningful(strokes: readonly Stroke[]): boolean;
