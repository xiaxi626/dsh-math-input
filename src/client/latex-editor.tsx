import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { renderLatex } from '../latex/render.js'
import type { MathInputUiStore } from './ui-store.js'

type Translate = TranslateNS<'math-input'>

const GREEK = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda', 'mu', 'pi', 'sigma', 'phi', 'omega'] as const
const TEMPLATES = ['\\frac{}{}', '\\sqrt{}', '\\sum_{}^{}', '\\int_{}^{}', 'x^{2}', 'x_{i}', '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}'] as const

export type LatexEditorDockProps = {
  readonly input: { readonly draft: string }
  readonly inputActions: { setDraft(text: string): void }
  readonly t: Translate
  readonly uiStore: MathInputUiStore
}

const paletteButtonStyle: React.CSSProperties = {
  padding: '2px 6px',
  fontSize: 12,
  borderRadius: 4,
  border: '1px solid var(--dsw-alias-border-primary, rgba(0,0,0,0.15))',
  background: 'transparent',
  cursor: 'pointer',
  color: 'inherit',
}

export function LatexEditorDock({ input, inputActions, t, uiStore }: LatexEditorDockProps) {
  const open = useSyncExternalStore(uiStore.subscribe, uiStore.getLatexDockOpen)
  const [source, setSource] = useState('')
  const previewRef = useRef<HTMLDivElement | null>(null)

  useMemo(() => {
    if (previewRef.current !== null && source.trim() !== '') renderLatex(source, previewRef.current)
  }, [source])

  if (!open) return null

  const insertSnippet = (snippet: string) => {
    setSource((current) => current + snippet)
  }

  const confirm = () => {
    const trimmed = source.trim()
    if (trimmed === '') return
    const draft = input.draft
    const separator = draft === '' || /\s$/.test(draft) ? '' : ' '
    inputActions.setDraft(`${draft}${separator}\\[${trimmed}\\]`)
    setSource('')
    uiStore.toggleLatexDock()
  }

  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 4px', alignItems: 'stretch' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <textarea
          value={source}
          onChange={(event) => setSource(event.target.value)}
          rows={3}
          style={{ width: '100%', fontFamily: 'monospace' }}
          aria-label={t('editorTitle')}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {GREEK.map((symbol) => (
            <button key={symbol} type="button" onClick={() => insertSnippet(`\\${symbol} `)} style={paletteButtonStyle}>
              {symbol}
            </button>
          ))}
          {TEMPLATES.map((template) => (
            <button key={template} type="button" onClick={() => insertSnippet(template)} style={paletteButtonStyle}>
              {template.length > 12 ? `${template.slice(0, 12)}…` : template}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{t('previewTitle')}</div>
        <div ref={previewRef} style={{ minHeight: 48 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-end' }}>
        <button type="button" onClick={confirm} disabled={source.trim() === ''}>{t('editorInsert')}</button>
      </div>
    </div>
  )
}
