import test from 'node:test'
import assert from 'node:assert/strict'
import TYPERT from '../src/typert.js'
import TYPERT_REMOTE from '../src/remote.js'
import { mathInputSettingsSchema, mathInputSettingsPatchSchema, mathInputSettingsViewSchema } from '../src/remote-contract.js'

test('typert manifest declares both settings invocations', () => {
  const ids = TYPERT.invocations.map((invocation) => invocation.id)
  assert.deepEqual(ids, ['dsh-math-input#mathInput/getSettings', 'dsh-math-input#mathInput/updateSettings'])
  assert.equal(TYPERT.package, 'dsh-math-input')
  assert.equal(TYPERT.face, 'host')
})

test('remote descriptors mirror the typert manifest', () => {
  assert.deepEqual(
    TYPERT_REMOTE.descriptors.map((descriptor) => descriptor.id),
    TYPERT.invocations.map((invocation) => invocation.id),
  )
  assert.equal(TYPERT_REMOTE.package, 'dsh-math-input')
})

test('updateSettings parameter and cancellation are declared', () => {
  const update = TYPERT.invocations[1]
  assert.ok(update)
  assert.equal(update.parameters.length, 1)
  assert.equal(update.parameters[0]?.wire, 'patch')
  assert.deepEqual(update.cancellation, { parameter: 'signal' })
})

test('wire schemas accept defaults and reject junk', () => {
  const settings = { recognitionMode: 'auto', beamWidth: 3, executionProvider: 'wasm', strokeDebounceSeconds: 1.5, language: '' }
  assert.deepEqual(mathInputSettingsSchema.parse(settings), settings)
  assert.deepEqual(mathInputSettingsPatchSchema.parse({ beamWidth: 1 }), { beamWidth: 1 })
  assert.ok(mathInputSettingsViewSchema.parse({ available: true, writable: true, settings, overridden: [] }))
  assert.throws(() => mathInputSettingsSchema.parse({ beamWidth: 'three' }))
})
