export const TARGET_HEIGHT = 256
export const ALIGNMENT = 64

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

export function toGrayscaleFloat(image: ImageLike): Float32Array {
  const values = new Float32Array(image.width * image.height)
  for (let index = 0; index < values.length; index += 1) {
    const r = image.data[index * 4] ?? 0
    const g = image.data[index * 4 + 1] ?? 0
    const b = image.data[index * 4 + 2] ?? 0
    values[index] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
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

/** Screenshot/pasted image -> CoMER encoder input (white ink on black, 256h, 64-aligned). */
export function imageToTensor(image: ImageLike): GrayImage {
  const gray = toGrayscaleFloat(image)
  const inked = invert(gray)
  const scaled = scaleToHeight(inked, image.width, image.height, TARGET_HEIGHT)
  return padToMultiple(scaled.values, scaled.width, scaled.height, ALIGNMENT)
}
