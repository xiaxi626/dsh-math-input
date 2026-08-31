import { useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { HandwritingPad } from './handwriting-pad.jsx'
import { ScreenshotOcr } from './screenshot-ocr.jsx'
import type { MathInputUiStore } from './ui-store.js'
import type { SettingsFace } from './settings-controller.js'

type Translate = TranslateNS<'math-input'>

export type LauncherProps = {
  readonly input: { readonly draft: string }
  readonly inputActions: { setDraft(text: string): void }
  readonly t: Translate
  readonly useSettings: () => SettingsFace
  readonly uiStore: MathInputUiStore
}

type WindowKind = 'none' | 'handwriting' | 'screenshot'

const menuItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '8px 12px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: 'inherit',
}

export function Launcher({ input, inputActions, t, useSettings, uiStore }: LauncherProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [window, setWindow] = useState<WindowKind>('none')
  const settingsFace = useSettings()
  const settings = settingsFace.settings

  const insertLatex = (latex: string) => {
    const draft = input.draft
    const separator = draft === '' || /\s$/.test(draft) ? '' : ' '
    inputActions.setDraft(`${draft}${separator}\\[${latex}\\]`)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        title={t('launcherTitle')}
        aria-label={t('launcherTitle')}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        style={{
          width: 28,
          height: 28,
          border: 'none',
          borderRadius: 6,
          background: 'transparent',
          color: 'var(--dsw-alias-label-primary, inherit)',
          cursor: 'pointer',
          fontSize: 16,
        }}
      >
        +
      </button>
      {menuOpen ? (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: 6,
            minWidth: 180,
            borderRadius: 8,
            padding: 4,
            zIndex: 8500,
            background: 'var(--dsw-alias-bg-layer-2, #fff)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
          }}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <button type="button" style={menuItemStyle} onClick={() => { setMenuOpen(false); setWindow('handwriting') }}>
            {t('menuHandwriting')}
          </button>
          <button type="button" style={menuItemStyle} onClick={() => { setMenuOpen(false); setWindow('screenshot') }}>
            {t('menuScreenshot')}
          </button>
          <button type="button" style={menuItemStyle} onClick={() => { setMenuOpen(false); uiStore.toggleLatexDock() }}>
            {t('menuLatexEditor')}
          </button>
        </div>
      ) : null}
      {window === 'handwriting' ? (
        <HandwritingPad t={t} settings={settings} onClose={() => setWindow('none')} onInsert={insertLatex} />
      ) : null}
      {window === 'screenshot' ? (
        <ScreenshotOcr t={t} settings={settings} onClose={() => setWindow('none')} onInsert={insertLatex} />
      ) : null}
    </div>
  )
}
