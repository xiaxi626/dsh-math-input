import test from 'node:test'
import assert from 'node:assert/strict'
import { pickValidLatex, type RecognitionResult } from '../src/recognition/engine.js'

test('picks the first KaTeX-valid candidate', () => {
  const results: RecognitionResult[] = [
    { latex: '\\frac{', score: 0.9 },
    { latex: '\\frac{a}{b}', score: 0.7 },
    { latex: 'x^2', score: 0.5 },
  ]
  assert.equal(pickValidLatex(results), '\\frac{a}{b}')
})

test('repairs a repairable candidate when nothing is directly valid', () => {
  const results: RecognitionResult[] = [{ latex: '\\frac{a}{b', score: 0.9 }]
  assert.equal(pickValidLatex(results), '\\frac{a}{b}')
})

test('returns undefined when nothing works', () => {
  assert.equal(pickValidLatex([]), undefined)
  assert.equal(pickValidLatex([{ latex: '', score: 1 }]), undefined)
})
