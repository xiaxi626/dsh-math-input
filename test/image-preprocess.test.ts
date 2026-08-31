import test from 'node:test'
import assert from 'node:assert/strict'
import { toGrayscaleFloat, invert, scaleToHeight, padToMultiple, imageToTensor, splitIntoLines, TARGET_HEIGHT, ALIGNMENT } from '../src/recognition/image-preprocess.js'

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

function blackImage(width: number, height: number): { width: number; height: number; data: Uint8ClampedArray } {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = 0
    data[i * 4 + 1] = 0
    data[i * 4 + 2] = 0
    data[i * 4 + 3] = 255
  }
  return { width, height, data }
}

test('grayscale luminance uses NTSC weights', () => {
  const img = { width: 1, height: 1, data: new Uint8ClampedArray([255, 0, 0, 255]) }
  const gray = toGrayscaleFloat(img)
  assert.ok(Math.abs(gray[0]! - 0.299) < 0.01)
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

test('imageToTensor returns MODEL_H-tall tensor with mask', () => {
  const result = imageToTensor(whiteImage(128, 64))
  assert.equal(result.height, TARGET_HEIGHT)
  assert.equal(result.width % ALIGNMENT, 0)
  assert.equal(result.tensor.length, result.height * result.width)
  assert.equal(result.mask.length, result.height * result.width)
  assert.equal(result.tensor[0], 0)
  assert.equal(result.tensor[result.tensor.length - 1], 0)
  assert.equal(result.mask[0], 0)
  assert.equal(result.mask[result.mask.length - 1], 1)
})

test('imageToTensor content at top, padding at bottom', () => {
  const img = blackImage(128, 64)
  const result = imageToTensor(img)
  assert.equal(result.height, TARGET_HEIGHT)
  assert.equal(result.mask[0], 0)
  const lastContentRow = 127 * result.width
  const firstPaddingRow = 128 * result.width
  assert.ok(result.mask[lastContentRow] === 0 || result.mask[firstPaddingRow] === 1)
})

test('splitIntoLines returns single image for one-line content', () => {
  const img = blackImage(64, 32)
  const lines = splitIntoLines(img)
  assert.equal(lines.length, 1)
})

test('splitIntoLines detects multiple horizontal bands', () => {
  const w = 64
  const h = 128
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y += 1) {
    const isContent = y < 32 || (y >= 64 && y < 96)
    const val = isContent ? 0 : 255
    for (let x = 0; x < w; x += 1) {
      const idx = (y * w + x) * 4
      data[idx] = val
      data[idx + 1] = val
      data[idx + 2] = val
      data[idx + 3] = 255
    }
  }
  const lines = splitIntoLines({ width: w, height: h, data })
  assert.equal(lines.length, 2)
  assert.equal(lines[0]!.height, 32)
  assert.equal(lines[1]!.height, 32)
})
