export type MathDelimiter = '\\[' | '$$';
export interface MathBlock {
    /** Offset of the opening delimiter in the source text. */
    start: number;
    /** Offset just past the closing delimiter (or end of text when unclosed). */
    end: number;
    /** Raw LaTeX between the delimiters. */
    latex: string;
    delimiter: MathDelimiter;
    closed: boolean;
}
export declare function detectMathBlocks(text: string): MathBlock[];
/** Render one LaTeX string into an element; returns false when unrenderable. */
export declare function renderLatex(latex: string, element: HTMLElement): boolean;
