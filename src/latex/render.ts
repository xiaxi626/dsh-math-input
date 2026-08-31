export type MathDelimiter = '\\[' | '$$'

export interface MathBlock {
  /** Offset of the opening delimiter in the source text. */
  start: number
  /** Offset just past the closing delimiter (or end of text when unclosed). */
  end: number
  /** Raw LaTeX between the delimiters. */
  latex: string
  delimiter: MathDelimiter
  closed: boolean
}

function isOpenAt(text: string, index: number, token: string): boolean {
  if (text.startsWith(token, index) === false) return false
  let backslashes = 0
  let cursor = index - 1
  while (cursor >= 0 && text[cursor] === '\\') {
    backslashes += 1
    cursor -= 1
  }
  return backslashes % 2 === 0
}

export function detectMathBlocks(text: string): MathBlock[] {
  const blocks: MathBlock[] = []
  const delimiters: readonly { open: MathDelimiter; close: string }[] = [
    { open: '\\[', close: '\\]' },
    { open: '$$', close: '$$' },
  ]
  let index = 0
  while (index < text.length) {
    let matched = false
    for (const { open, close } of delimiters) {
      if (isOpenAt(text, index, open)) {
        const contentStart = index + open.length
        const closeIndex = findClosing(text, contentStart, close)
        if (closeIndex === -1) {
          index = contentStart
        } else {
          blocks.push({
            start: index,
            end: closeIndex + close.length,
            latex: text.slice(contentStart, closeIndex),
            delimiter: open,
            closed: true,
          })
          index = closeIndex + close.length
        }
        matched = true
        break
      }
      matched = false
    }
    if (matched === false) index += 1
  }
  return blocks
}

function findClosing(text: string, from: number, close: string): number {
  let cursor = from
  while (cursor < text.length) {
    const found = text.indexOf(close, cursor)
    if (found === -1) return -1
    if (isOpenAt(text, found, close) || close !== '\\]') return found
    cursor = found + close.length
  }
  return -1
}
