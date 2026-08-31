import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_SETTINGS, validateSettings, effectiveDebounceMs, type MathInputSettings } from '../src/config.js'

test('defaults are complete and frozen', () => {
  assert.equal(DEFAULT_SETTINGS.recognitionMode, 'auto')
  assert.equal(DEFAULT_SETTINGS.beamWidth, 3)
  assert.equal(DEFAULT_SETTINGS.executionProvider, 'wasm')
  assert.equal(DEFAULT_SETTINGS.strokeDebounceSeconds, 1.5)
  assert.equal(DEFAULT_SETTINGS.language, '')
  assert.ok(Object.isFrozen(DEFAULT_SETTINGS))
})

test('validateSettings accepts defaults', () => {
  validateSettings(DEFAULT_SETTINGS)
})

test('validateSettings rejects bad beam width', () => {
  const bad: MathInputSettings = { ...DEFAULT_SETTINGS, beamWidth: 4 }
  assert.throws(() => validateSettings(bad), /beam width/i)
})

test('validateSettings rejects bad debounce', () => {
  const bad: MathInputSettings = { ...DEFAULT_SETTINGS, strokeDebounceSeconds: 0 }
  assert.throws(() => validateSettings(bad), /debounce/i)
})

test('validateSettings rejects unknown mode and provider', () => {
  assert.throws(() => validateSettings({ ...DEFAULT_SETTINGS, recognitionMode: 'kanji' as never }), /recognition mode/i)
  assert.throws(() => validateSettings({ ...DEFAULT_SETTINGS, executionProvider: 'cuda' as never }), /execution provider/i)
})

test('effectiveDebounceMs converts with fallback', () => {
  assert.equal(effectiveDebounceMs({ strokeDebounceSeconds: 1.5 }), 1500)
  assert.equal(effectiveDebounceMs({ strokeDebounceSeconds: -1 }), 1500)
})
