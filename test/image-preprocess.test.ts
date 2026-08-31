import test from 'node:test'
import assert from 'node:assert/strict'
import { toGrayscaleFloat, invert, scaleToHeight, padToMultiple, imageToTensor, TARGET_HEIGHT, ALIGNMENT } from '../src/recognition/image-preprocess.js'

function whiteImage(width: number, height: number): { width: number; height: number; data: Uint8ClampedArray } {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = 255
    data[i * 4 + 1] = 255
    data[i * 4 + 2] = 255
    data[i * 4 + 3] = 255
  }
  return { width, height, data }
}

test('grayscale luminance uses standard weights', () => {
  const img = { width: 1, height: 1, data: new Uint8ClampedArray([255, 0, 0, 255]) }
  const gray = toGrayscaleFloat(img)
  assert.ok(Math.abs(gray[0]! - 0.2126) < 0.01)
})

test('invert maps 0 -> 1 and 1 -> 0', () => {
  const values = new Float32Array([0, 1, 0.25])
  const out = invert(values)
  assert.deepEqual(Array.from(out), [1, 0, 0.75])
})

test('scaleToHeight produces target height and proportional width', () => {
  const scaled = scaleToHeight(new Float32Array(128 * 64).fill(0.5), 128, 64, TARGET_HEIGHT)
  assert.equal(scaled.height, TARGET_HEIGHT)
  assert.equal(scaled.width, 512)
  assert.equal(scaled.values.length, 512 * TARGET_HEIGHT)
  assert.ok(Math.abs(scaled.values[0]! - 0.5) < 0.01)
})

test('padToMultiple pads right/bottom with zeros to 64-alignment', () => {
  const padded = padToMultiple(new Float32Array(100 * 256).fill(1), 100, 256, ALIGNMENT)
  assert.equal(padded.width % ALIGNMENT, 0)
  assert.equal(padded.width, 128)
  assert.equal(padded.values[99], 1)
  assert.equal(padded.values[100], 0)
})

test('imageToTensor returns white-on-black 1xHxW Float32Array', () => {
  const tensor = imageToTensor(whiteImage(128, 64))
  assert.equal(tensor.height, TARGET_HEIGHT)
  assert.equal(tensor.width % ALIGNMENT, 0)
  assert.equal(tensor.values[0], 0)
  assert.equal(tensor.values[tensor.values.length - 1], 0)
})
