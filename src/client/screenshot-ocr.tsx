import { useEffect, useRef, useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { Modal } from './ui/modal.jsx'
import { renderLatex } from '../latex/render.js'
import { imageToTensor } from '../recognition/image-preprocess.js'
import { pickValidLatex, getSharedRecognizer, recognizeOptionsFrom } from '../recognition/engine.js'
import type { MathInputSettings } from '../config.js'

type Translate = TranslateNS<'math-input'>

export type ScreenshotOcrProps = {
  readonly t: Translate
  readonly settings: MathInputSettings
  readonly onClose: () => void
  readonly onInsert: (latex: string) => void
}

export function ScreenshotOcr({ t, settings, onClose, onInsert }: ScreenshotOcrProps) {
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [latex, setLatex] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) => entry.type.startsWith('image/'))
      const file = item?.getAsFile()
      if (file !== undefined && file !== null) void recognizeFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  })

  const recognizeFile = async (file: File) => {
    setBusy(true)
    setError('')
    try {
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')
      if (context === null) throw new Error('canvas 2d context unavailable')
      context.drawImage(bitmap, 0, 0)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const tensor = imageToTensor({ width: imageData.width, height: imageData.height, data: imageData.data })
      const results = await getSharedRecognizer().recognizeTensor(tensor.values, tensor.width, tensor.height, recognizeOptionsFrom(settings))
      const picked = pickValidLatex(results)
      if (picked === undefined) {
        setError('No formula recognized')
      } else {
        setLatex(picked)
        if (previewRef.current !== null) renderLatex(picked, previewRef.current)
      }
      bitmap.close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={t('ocrTitle')} onClose={onClose}>
      <p style={{ opacity: 0.8 }}>{t('ocrPasteHint')}</p>
      <input
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file !== undefined) void recognizeFile(file)
        }}
      />
      <div style={{ marginTop: 12, minHeight: 48 }} ref={previewRef} />
      {error !== '' ? <p style={{ color: 'var(--dsw-alias-state-error-secondary, #e5484d)' }}>{error}</p> : null}
      <textarea value={latex} onChange={(event) => setLatex(event.target.value)} rows={2} style={{ width: '100%', fontFamily: 'monospace' }} aria-label="latex source" />
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
