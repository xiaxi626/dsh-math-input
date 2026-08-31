import test from 'node:test'
import assert from 'node:assert/strict'
import { isStrokeMeaningful, strokeBounds, type Stroke } from '../src/recognition/preprocess.js'

const dot: Stroke[] = [{ points: [{ x: 5, y: 5 }] }]
const tiny: Stroke[] = [{ points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }]
const real: Stroke[] = [{ points: [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 40 }] }]

test('single accidental tap is not meaningful', () => {
  assert.equal(isStrokeMeaningful(dot), false)
})

test('sub-pixel scribble is not meaningful', () => {
  assert.equal(isStrokeMeaningful(tiny), false)
})

test('an actual stroke is meaningful', () => {
  assert.equal(isStrokeMeaningful(real), true)
})

test('empty stroke list is not meaningful', () => {
  assert.equal(isStrokeMeaningful([]), false)
})

test('bounds cover all strokes', () => {
  const b = strokeBounds([...real, { points: [{ x: -5, y: 60 }] }])
  assert.ok(b)
  assert.equal(b.minX, -5)
  assert.equal(b.maxY, 60)
  assert.equal(b.width, 35)
  assert.equal(b.height, 60)
})

test('bounds of empty input is undefined', () => {
  assert.equal(strokeBounds([]), undefined)
})
