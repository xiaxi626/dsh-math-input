import { useEffect, useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { MathInputSettingsPatch } from '../config.js'
import type { SettingsController } from './settings-controller.js'
import { useSettingsSnapshot } from './settings-controller.js'

type Translate = TranslateNS<'math-input'>

export type SettingsSectionProps = {
  readonly close: () => void
  readonly t: Translate
  readonly settingsController: SettingsController
}

const inputStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid var(--dsw-alias-border-primary, rgba(0,0,0,0.15))',
  background: 'var(--dsw-alias-bg-layer-2, transparent)',
  color: 'var(--dsw-alias-label-primary, inherit)',
}

function Field(props: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{ display: 'block', fontWeight: 600, fontSize: 13 }}>{props.label}</span>
      <span style={{ display: 'block', fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{props.hint}</span>
      {props.children}
    </label>
  )
}

export function MathInputSettingsSection({ settingsController, t }: SettingsSectionProps) {
  const snapshot = useSettingsSnapshot(settingsController)
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    void settingsController.refreshSettings()
  }, [settingsController])

  if (snapshot.status === 'loading') return <p>{t('loading')}</p>

  const s = snapshot.view.settings
  const save = async (patch: MathInputSettingsPatch) => {
    setSaveFailed(false)
    const ok = await settingsController.update(patch)
    if (!ok) setSaveFailed(true)
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ marginTop: 0 }}>{t('settingsTitle')}</h2>
      <p style={{ opacity: 0.8 }}>{t('settingsDescription')}</p>
      {saveFailed ? <p style={{ color: 'var(--dsw-alias-state-error-secondary, #e5484d)' }}>{t('saveFailed')}</p> : null}

      <Field label={t('recognitionModeLabel')} hint={t('recognitionModeHint')}>
        <select style={inputStyle} value={s.recognitionMode} onChange={(event) => void save({ recognitionMode: event.target.value as 'auto' | 'number' | 'expression' })}>
          <option value="auto">{t('modeAuto')}</option>
          <option value="number">{t('modeNumber')}</option>
          <option value="expression">{t('modeExpression')}</option>
        </select>
      </Field>

      <Field label={t('beamWidthLabel')} hint={t('beamWidthHint')}>
        <select style={inputStyle} value={s.beamWidth} onChange={(event) => void save({ beamWidth: Number(event.target.value) })}>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </Field>

      <Field label={t('providerLabel')} hint={t('providerHint')}>
        <select style={inputStyle} value={s.executionProvider} onChange={(event) => void save({ executionProvider: event.target.value as 'wasm' | 'webgpu' })}>
          <option value="wasm">wasm</option>
          <option value="webgpu">webgpu</option>
        </select>
      </Field>

      <Field label={t('debounceLabel')} hint={t('debounceHint')}>
        <DebounceInput key={s.strokeDebounceSeconds} initial={s.strokeDebounceSeconds} onCommit={(value) => void save({ strokeDebounceSeconds: value })} style={inputStyle} />
      </Field>

      <Field label={t('languageLabel')} hint={t('languageHint')}>
        <LanguageInput key={s.language} initial={s.language} placeholder={t('languagePlaceholder')} onCommit={(value) => void save({ language: value })} style={inputStyle} />
      </Field>
    </div>
  )
}

function DebounceInput(props: { initial: number; onCommit: (value: number) => void; style: React.CSSProperties }) {
  const [text, setText] = useState(String(props.initial))
  return (
    <input
      type="number"
      min={0.3}
      max={10}
      step={0.1}
      value={text}
      style={props.style}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => {
        const value = Number(text)
        if (Number.isFinite(value) && value !== props.initial) props.onCommit(value)
      }}
    />
  )
}

function LanguageInput(props: { initial: string; placeholder: string; onCommit: (value: string) => void; style: React.CSSProperties }) {
  const [text, setText] = useState(props.initial)
  return (
    <input
      type="text"
      value={text}
      placeholder={props.placeholder}
      style={props.style}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => {
        const value = text.trim()
        if (value !== props.initial) props.onCommit(value)
      }}
    />
  )
}
