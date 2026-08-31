import test from 'node:test'
import assert from 'node:assert/strict'
import { detectMathBlocks } from '../src/latex/render.js'

test('detects one closed display block', () => {
  const blocks = detectMathBlocks('energy: \\[E=mc^2\\] done')
  assert.equal(blocks.length, 1)
  const b = blocks[0]
  assert.ok(b)
  assert.equal(b.closed, true)
  assert.equal(b.latex, 'E=mc^2')
  assert.equal(b.delimiter, '\\[')
  assert.equal('energy: \\[E=mc^2\\] done'.slice(b.start, b.end), '\\[E=mc^2\\]')
})

test('unclosed \\[ stays plain (no block emitted as closed)', () => {
  const blocks = detectMathBlocks('start \\[x+1')
  assert.equal(blocks.filter((b) => b.closed).length, 0)
})

test('detects $$ pairs for pasted content', () => {
  const blocks = detectMathBlocks('a $$x^2$$ b')
  assert.equal(blocks.length, 1)
  assert.equal(blocks[0]?.delimiter, '$$')
  assert.equal(blocks[0]?.latex, 'x^2')
})

test('multiple blocks, order preserved', () => {
  const blocks = detectMathBlocks('\\[a\\] mid \\[b\\]')
  assert.deepEqual(blocks.map((b) => b.latex), ['a', 'b'])
})

test('escaped delimiters are not opens', () => {
  const blocks = detectMathBlocks('price \\\\[not-a-block')
  assert.equal(blocks.filter((b) => b.closed).length, 0)
})

test('empty latex between delimiters still counts as closed', () => {
  const blocks = detectMathBlocks('\\[\\]')
  assert.equal(blocks.length, 1)
  assert.equal(blocks[0]?.closed, true)
  assert.equal(blocks[0]?.latex, '')
})
