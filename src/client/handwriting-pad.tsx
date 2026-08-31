import { useEffect, useRef, useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { Modal } from './ui/modal.jsx'
import { renderLatex } from '../latex/render.js'
import type { Stroke } from '../recognition/preprocess.js'
import { recognizeStrokes, getSharedRecognizer, recognizeOptionsFrom } from '../recognition/engine.js'
import { effectiveDebounceMs, type MathInputSettings } from '../config.js'

type Translate = TranslateNS<'math-input'>

export type HandwritingPadProps = {
  readonly t: Translate
  readonly settings: MathInputSettings
  readonly onClose: () => void
  readonly onInsert: (latex: string) => void
}

export function HandwritingPad({ t, settings, onClose, onInsert }: HandwritingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const strokesRef = useRef<Stroke[]>([])
  const drawingRef = useRef<Stroke | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [latex, setLatex] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
  }, [])

  // Re-render the KaTeX preview whenever the LaTeX source changes, whether the
  // change comes from recognition output or from the user editing the source
  // field below. This is what makes the recognition result visibly show up.
  useEffect(() => {
    const preview = previewRef.current
    if (preview === null) return
    if (latex.trim() === '') {
      preview.textContent = ''
      return
    }
    renderLatex(latex, preview)
  }, [latex])

  const redraw = () => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const context = canvas.getContext('2d')
    if (context === null) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.lineWidth = 2.5
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = '#111'
    for (const stroke of strokesRef.current) {
      if (stroke.points.length === 0) continue
      context.beginPath()
      const first = stroke.points[0]
      if (first === undefined) continue
      context.moveTo(first.x, first.y)
      for (const point of stroke.points.slice(1)) context.lineTo(point.x, point.y)
      context.stroke()
    }
  }

  const runRecognition = async (strokes: Stroke[]) => {
    setBusy(true)
    setError(null)
    try {
      const result = await recognizeStrokes(getSharedRecognizer(), strokes, recognizeOptionsFrom(settings))
      if (result !== undefined) setLatex(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const armDebounce = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void runRecognition([...strokesRef.current])
    }, effectiveDebounceMs(settings))
  }

  const pointerPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  return (
    <Modal title={t('padTitle')} onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button type="button" onClick={() => { strokesRef.current.pop(); redraw() }}>{t('padUndo')}</button>
        <button type="button" onClick={() => { strokesRef.current = []; redraw(); setLatex(''); setError(null) }}>{t('padClear')}</button>
      </div>
      <canvas
        ref={canvasRef}
        width={640}
        height={280}
        style={{ border: '1px solid var(--dsw-alias-border-primary, rgba(0,0,0,0.15))', borderRadius: 8, touchAction: 'none', background: '#fff' }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setError(null)
          const stroke: Stroke = { points: [pointerPosition(event)] }
          drawingRef.current = stroke
          strokesRef.current = [...strokesRef.current, stroke]
          redraw()
        }}
        onPointerMove={(event) => {
          const stroke = drawingRef.current
          if (stroke === null) return
          stroke.points.push(pointerPosition(event))
          redraw()
        }}
        onPointerUp={() => {
          drawingRef.current = null
          armDebounce()
        }}
      />
      <div style={{ marginTop: 12, marginBottom: 4, fontSize: 13, fontWeight: 600, color: 'var(--dsw-alias-text-secondary, rgba(0,0,0,0.65))' }}>{t('padResultLabel')}</div>
      <div
        style={{ minHeight: 48, padding: 4, border: '1px solid var(--dsw-alias-border-primary, rgba(0,0,0,0.15))', borderRadius: 8, background: 'var(--dsw-alias-bg-secondary, rgba(0,0,0,0.02))', cursor: 'text' }}
        ref={previewRef}
        data-math-input-preview="true"
        onClick={() => { inputRef.current?.focus() }}
      />
      {busy && (
        <div style={{ marginTop: 4, fontSize: 13, color: 'var(--dsw-alias-text-secondary, rgba(0,0,0,0.65))' }} role="status" aria-live="polite">{t('padRecognizing')}</div>
      )}
      {error !== null && (
        <div style={{ marginTop: 4, fontSize: 13, color: '#c62828', wordBreak: 'break-word' }} role="alert" aria-live="assertive">{t('padError')}: {error}</div>
      )}
      <input
        ref={inputRef}
        type="text"
        value={latex}
        onChange={(event) => setLatex(event.target.value)}
        placeholder={t('padSourcePlaceholder')}
        style={{ width: '100%', marginTop: 4, padding: '4px 8px', fontFamily: 'monospace', fontSize: 13, border: '1px solid var(--dsw-alias-border-primary, rgba(0,0,0,0.15))', borderRadius: 8, boxSizing: 'border-box' }}
        aria-label="latex source"
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button type="button" onClick={onClose}>{t('padCancel')}</button>
        <button
          type="button"
          disabled={busy || latex.trim() === ''}
          onClick={() => {
            onInsert(latex.trim())
            onClose()
          }}
        >
          {busy ? t('padRecognizing') : t('padConfirm')}
        </button>
      </div>
    </Modal>
  )
}
