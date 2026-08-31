export const MODEL_H = 256
export const TARGET_H = 128
export const MAX_W = 1024
export const MIN_W = 128
export const W_ALIGN = 64
export const PAD = 16

export const TARGET_HEIGHT = MODEL_H
export const ALIGNMENT = W_ALIGN

export interface ImageLike {
  width: number
  height: number
  data: Uint8ClampedArray
}

export interface GrayImage {
  width: number
  height: number
  values: Float32Array
}

export interface TensorInput {
  tensor: Float32Array
  height: number
  width: number
  mask: Uint8Array
  maskHeight: number
  maskWidth: number
}

export function toGrayscaleFloat(image: ImageLike): Float32Array {
  const values = new Float32Array(image.width * image.height)
  for (let index = 0; index < values.length; index += 1) {
    const r = image.data[index * 4] ?? 0
    const g = image.data[index * 4 + 1] ?? 0
    const b = image.data[index * 4 + 2] ?? 0
    values[index] = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  }
  return values
}

export function invert(values: Float32Array): Float32Array {
  const out = new Float32Array(values.length)
  for (let index = 0; index < values.length; index += 1) {
    out[index] = 1 - (values[index] ?? 0)
  }
  return out
}

export function scaleToHeight(values: Float32Array, width: number, height: number, targetHeight: number): GrayImage {
  const targetWidth = Math.max(1, Math.round((width / height) * targetHeight))
  const out = new Float32Array(targetWidth * targetHeight)
  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(height - 1, (y / targetHeight) * height)
    const y0 = Math.floor(sourceY)
    const y1 = Math.min(height - 1, y0 + 1)
    const yMix = sourceY - y0
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(width - 1, (x / targetWidth) * width)
      const x0 = Math.floor(sourceX)
      const x1 = Math.min(width - 1, x0 + 1)
      const xMix = sourceX - x0
      const top = (values[y0 * width + x0] ?? 0) * (1 - xMix) + (values[y0 * width + x1] ?? 0) * xMix
      const bottom = (values[y1 * width + x0] ?? 0) * (1 - xMix) + (values[y1 * width + x1] ?? 0) * xMix
      out[y * targetWidth + x] = top * (1 - yMix) + bottom * yMix
    }
  }
  return { width: targetWidth, height: targetHeight, values: out }
}

export function padToMultiple(values: Float32Array, width: number, height: number, multiple: number): GrayImage {
  const paddedWidth = Math.ceil(width / multiple) * multiple
  const paddedHeight = Math.ceil(height / multiple) * multiple
  if (paddedWidth === width && paddedHeight === height) {
    return { width, height, values }
  }
  const out = new Float32Array(paddedWidth * paddedHeight)
  for (let y = 0; y < height; y += 1) {
    out.set(values.subarray(y * width, (y + 1) * width), y * paddedWidth)
  }
  return { width: paddedWidth, height: paddedHeight, values: out }
}

function scaleToHeightClamped(values: Float32Array, width: number, height: number, targetHeight: number, maxWidth: number): GrayImage {
  let scale = targetHeight / height
  if (width * scale > maxWidth) scale = maxWidth / width
  const targetWidth = Math.max(1, Math.round(width * scale))
  const targetH = Math.max(1, Math.round(height * scale))
  const out = new Float32Array(targetWidth * targetH)
  for (let y = 0; y < targetH; y += 1) {
    const sourceY = Math.min(height - 1, (y / targetH) * height)
    const y0 = Math.floor(sourceY)
    const y1 = Math.min(height - 1, y0 + 1)
    const yMix = sourceY - y0
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(width - 1, (x / targetWidth) * width)
      const x0 = Math.floor(sourceX)
      const x1 = Math.min(width - 1, x0 + 1)
      const xMix = sourceX - x0
      const top = (values[y0 * width + x0] ?? 0) * (1 - xMix) + (values[y0 * width + x1] ?? 0) * xMix
      const bottom = (values[y1 * width + x0] ?? 0) * (1 - xMix) + (values[y1 * width + x1] ?? 0) * xMix
      out[y * targetWidth + x] = top * (1 - yMix) + bottom * yMix
    }
  }
  return { width: targetWidth, height: targetH, values: out }
}

export function imageToTensor(image: ImageLike): TensorInput {
  const gray = toGrayscaleFloat(image)
  const inked = invert(gray)
  const scaled = scaleToHeightClamped(inked, image.width, image.height, TARGET_H, MAX_W)
  const canvasW = Math.min(MAX_W, Math.max(MIN_W, Math.ceil((scaled.width + PAD) / W_ALIGN) * W_ALIGN))
  const tensor = new Float32Array(MODEL_H * canvasW)
  for (let y = 0; y < scaled.height; y += 1) {
    for (let x = 0; x < scaled.width; x += 1) {
      tensor[y * canvasW + x] = scaled.values[y * scaled.width + x] ?? 0
    }
  }
  const mask = new Uint8Array(MODEL_H * canvasW)
  for (let y = 0; y < MODEL_H; y += 1) {
    for (let x = 0; x < canvasW; x += 1) {
      mask[y * canvasW + x] = y < scaled.height && x < scaled.width ? 0 : 1
    }
  }
  return { tensor, height: MODEL_H, width: canvasW, mask, maskHeight: MODEL_H, maskWidth: canvasW }
}

export function splitIntoLines(image: ImageLike, gapThreshold = 3): ImageLike[] {
  const gray = toGrayscaleFloat(image)
  const inked = invert(gray)
  const rowSums = new Float32Array(image.height)
  for (let y = 0; y < image.height; y += 1) {
    let sum = 0
    for (let x = 0; x < image.width; x += 1) {
      sum += inked[y * image.width + x] ?? 0
    }
    rowSums[y] = sum
  }
  const maxSum = Math.max(...rowSums)
  if (maxSum <= 0) return [image]
  const threshold = maxSum * 0.02
  const lines: ImageLike[] = []
  let start = -1
  let gapCount = 0
  for (let y = 0; y < image.height; y += 1) {
    if ((rowSums[y] ?? 0) > threshold) {
      if (start === -1) start = y
      gapCount = 0
    } else if (start !== -1) {
      gapCount += 1
      if (gapCount >= gapThreshold) {
        const end = y - gapCount
        if (end >= start) {
          const h = end - start + 1
          const data = new Uint8ClampedArray(image.width * h * 4)
          for (let row = 0; row < h; row += 1) {
            const srcOffset = ((start + row) * image.width) * 4
            const dstOffset = row * image.width * 4
            for (let i = 0; i < image.width * 4; i += 1) {
              data[dstOffset + i] = image.data[srcOffset + i] ?? 0
            }
          }
          lines.push({ width: image.width, height: h, data })
        }
        start = -1
        gapCount = 0
      }
    }
  }
  if (start !== -1) {
    const h = image.height - start
    const data = new Uint8ClampedArray(image.width * h * 4)
    for (let row = 0; row < h; row += 1) {
      const srcOffset = ((start + row) * image.width) * 4
      const dstOffset = row * image.width * 4
      for (let i = 0; i < image.width * 4; i += 1) {
        data[dstOffset + i] = image.data[srcOffset + i] ?? 0
      }
    }
    lines.push({ width: image.width, height: h, data })
  }
  return lines.length > 0 ? lines : [image]
}
