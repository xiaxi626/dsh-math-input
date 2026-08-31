import test from 'node:test'
import assert from 'node:assert/strict'
import { repairLatex, isValidLatex } from '../src/latex/repair.js'

test('valid latex passes through unchanged', () => {
  assert.equal(repairLatex('\\frac{a}{b}'), '\\frac{a}{b}')
})

test('balances missing closing braces', () => {
  assert.equal(repairLatex('\\frac{a}{b'), '\\frac{a}{b}')
})

test('drops stray closing braces', () => {
  assert.equal(repairLatex('x^2}}'), 'x^2')
})

test('completes truncated \\frac', () => {
  const repaired = repairLatex('\\frac{1}')
  assert.ok(isValidLatex(repaired), `expected valid latex, got ${repaired}`)
})

test('completes truncated \\sqrt', () => {
  const repaired = repairLatex('\\sqrt')
  assert.ok(isValidLatex(repaired), `expected valid latex, got ${repaired}`)
})

test('garbage that cannot be repaired is returned as-is', () => {
  assert.equal(repairLatex('???'), '???')
})

test('isValidLatex rejects empty and unbalanced', () => {
  assert.equal(isValidLatex(''), false)
  assert.equal(isValidLatex('\\frac{a}{'), false)
  assert.equal(isValidLatex('a+b'), true)
})
