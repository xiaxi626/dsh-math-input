import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type ModalProps = {
  readonly title: string
  readonly onClose: () => void
  readonly children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      data-math-input-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.45)',
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        style={{
          minWidth: 520,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 12,
          padding: 16,
          background: 'var(--dsw-alias-bg-layer-1, #fff)',
          color: 'var(--dsw-alias-label-primary, inherit)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button type="button" aria-label="close" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
