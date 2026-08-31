import katex from 'katex'

export function isValidLatex(latex: string): boolean {
  if (latex.trim() === '') return false
  try {
    katex.renderToString(latex, { throwOnError: true, output: 'mathml' })
    return true
  } catch {
    return false
  }
}

const ARITY_COMMANDS: ReadonlyMap<string, number> = new Map([
  ['\\frac', 2],
  ['\\sqrt', 1],
  ['\\sum', 0],
  ['\\int', 0],
])

export function repairLatex(latex: string): string {
  const candidates = [
    latex,
    balanceBraces(latex),
    ...completeArityCommands(balanceBraces(latex)),
  ]
  for (const candidate of candidates) {
    if (isValidLatex(candidate)) return candidate
  }
  return latex
}

export function balanceBraces(latex: string): string {
  let depth = 0
  let kept = ''
  for (const char of latex) {
    if (char === '{') {
      depth += 1
      kept += char
      continue
    }
    if (char === '}') {
      if (depth === 0) continue
      depth -= 1
      kept += char
      continue
    }
    kept += char
  }
  return kept + '}'.repeat(depth)
}

function completeArityCommands(latex: string): string[] {
  const results: string[] = []
  const pattern = /\\(frac|sqrt)\b/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(latex)) !== null) {
    const command = match[0]
    const arity = ARITY_COMMANDS.get(command) ?? 0
    const groups = countTrailingGroups(latex.slice(match.index))
    if (groups < arity) {
      const filled = latex + '{}'.repeat(arity - groups) + (groups === 0 ? '{x}' : '')
      results.push(balanceBraces(filled))
    }
  }
  return results
}

function countTrailingGroups(fragment: string): number {
  let count = 0
  let index = fragment.indexOf('{')
  while (index !== -1) {
    count += 1
    index = fragment.indexOf('{', index + 1)
  }
  return count
}
