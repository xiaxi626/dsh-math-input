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
  const strokesRef = useRef<Stroke[]>([])
  const drawingRef = useRef<Stroke | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [latex, setLatex] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
  }, [])

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
    try {
      const result = await recognizeStrokes(getSharedRecognizer(), strokes, recognizeOptionsFrom(settings))
      if (result !== undefined) {
        setLatex(result)
        if (previewRef.current !== null) renderLatex(result, previewRef.current)
      }
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
        <button type="button" onClick={() => { strokesRef.current = []; redraw(); setLatex('') }}>{t('padClear')}</button>
      </div>
      <canvas
        ref={canvasRef}
        width={640}
        height={280}
        style={{ border: '1px solid var(--dsw-alias-border-primary, rgba(0,0,0,0.15))', borderRadius: 8, touchAction: 'none', background: '#fff' }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
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
      <div style={{ marginTop: 12, minHeight: 48 }} ref={previewRef} data-math-input-preview="true" />
      <textarea
        value={latex}
        onChange={(event) => setLatex(event.target.value)}
        rows={2}
        style={{ width: '100%', fontFamily: 'monospace' }}
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
