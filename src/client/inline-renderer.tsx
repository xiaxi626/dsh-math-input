import { useEffect, useMemo, useRef } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { detectMathBlocks, renderLatex } from '../latex/render.js'

type Translate = TranslateNS<'math-input'>

export type InlineRendererProps = {
  readonly input: { readonly draft: string }
  readonly inputActions: { setDraft(text: string): void }
  readonly t: Translate
}

function FormulaChip({ latex }: { latex: string }) {
  const ref = useRef<HTMLSpanElement | null>(null)
  useEffect(() => {
    if (ref.current !== null) renderLatex(latex, ref.current)
  }, [latex])
  return (
    <span
      ref={ref}
      data-math-input-chip="true"
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 6,
        background: 'var(--dsw-alias-bg-layer-3, rgba(0,0,0,0.04))',
      }}
    />
  )
}

export function InlineRendererStrip({ input, t }: InlineRendererProps) {
  const blocks = useMemo(() => detectMathBlocks(input.draft).filter((block) => block.closed && block.latex.trim() !== ''), [input.draft])
  if (blocks.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', padding: '4px' }} aria-label={t('previewTitle')}>
      {blocks.map((block) => (
        <FormulaChip key={`${block.start}:${block.latex}`} latex={block.latex} />
      ))}
    </div>
  )
}
