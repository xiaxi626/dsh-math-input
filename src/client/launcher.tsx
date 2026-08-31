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

export function Launcher({ input, inputActions, t, useSettings, uiStore }: LauncherProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [window, setWindow] = useState<WindowKind>('none')
  const settingsFace = useSettings()
  const settings = settingsFace.settings

  const insertLatex = (latex: string) => {
    const draft = input.draft
    const separator = draft === '' || /\s$/.test(draft) ? '' : ' '
    inputActions.setDraft(`${draft}${separator}\\[${latex}\\]`)
  }

  const closeMenu = () => {
    setMenuOpen(false)
    setHoveredItem(null)
  }

  return (
    <div style={containerStyle}>
      <button
        type="button"
        title={t('launcherTitle')}
        aria-label={t('launcherTitle')}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={() => setMenuOpen((open) => !open)}
        style={launcherButtonStyle(menuOpen)}
      >
        <PlusIcon />
      </button>
      {menuOpen ? (
        <div
          role="menu"
          style={menuStyle}
          onMouseLeave={closeMenu}
        >
          <button
            type="button"
            role="menuitem"
            style={menuItemStyle(hoveredItem === 0)}
            onMouseEnter={() => setHoveredItem(0)}
            onClick={() => { closeMenu(); setWindow('handwriting') }}
          >
            {t('menuHandwriting')}
          </button>
          <button
            type="button"
            role="menuitem"
            style={menuItemStyle(hoveredItem === 1)}
            onMouseEnter={() => setHoveredItem(1)}
            onClick={() => { closeMenu(); setWindow('screenshot') }}
          >
            {t('menuScreenshot')}
          </button>
          <button
            type="button"
            role="menuitem"
            style={menuItemStyle(hoveredItem === 2)}
            onMouseEnter={() => setHoveredItem(2)}
            onClick={() => { closeMenu(); uiStore.toggleLatexDock() }}
          >
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

const containerStyle: React.CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
}

/**
 * Icon-only toolbar button mirroring dsh-better-input's MicrophoneButton:
 * 28×28, borderless, transparent, centered, flex:none. Active/open state
 * follows ConverterToggleButton's tertiary tint + primary accent.
 */
function launcherButtonStyle(open: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    padding: 0,
    border: 'none',
    borderRadius: 6,
    background: open ? 'var(--dsw-alias-state-business-tertiary, rgba(79,140,255,0.15))' : 'transparent',
    color: open ? 'var(--dsw-alias-state-business-primary, #4f8cff)' : 'var(--dsw-alias-label-secondary, inherit)',
    cursor: 'pointer',
    flex: 'none',
    transition: 'background 0.18s cubic-bezier(0.22,1,0.36,1), color 0.18s cubic-bezier(0.22,1,0.36,1)',
  }
}

/**
 * Popover matching dsh-better-input's OptimizeButton modal surface:
 * rounded layer-2 background, hairline border, soft shadow.
 */
const menuStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '100%',
  left: 0,
  marginBottom: 6,
  minWidth: 180,
  borderRadius: 10,
  padding: 4,
  zIndex: 8500,
  background: 'var(--dsw-alias-bg-layer-2, #fff)',
  border: '1px solid var(--dsw-alias-border-l2, #e0e0e0)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
}

function menuItemStyle(hovered: boolean): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 12px',
    border: 'none',
    borderRadius: 6,
    background: hovered ? 'var(--dsw-alias-state-business-tertiary, rgba(79,140,255,0.08))' : 'transparent',
    color: 'var(--dsw-alias-label-primary, inherit)',
    cursor: 'pointer',
    fontSize: 13,
    transition: 'background 0.15s ease',
  }
}

/**
 * Plus glyph drawn in the same 16×16 stroke idiom as dsh-better-input's
 * MicrophoneIcon (currentColor stroke, rounded caps).
 */
function PlusIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  )
}
