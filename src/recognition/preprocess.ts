export interface StrokePoint {
  x: number
  y: number
}

export interface Stroke {
  points: StrokePoint[]
}

export interface StrokeBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

const MIN_MEANINGFUL_EXTENT = 4
const MIN_MEANINGFUL_POINTS = 2

export function strokeBounds(strokes: readonly Stroke[]): StrokeBounds | undefined {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let sawPoint = false
  for (const stroke of strokes) {
    for (const point of stroke.points) {
      sawPoint = true
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }
  }
  if (sawPoint === false) return undefined
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

export function isStrokeMeaningful(strokes: readonly Stroke[]): boolean {
  const totalPoints = strokes.reduce((sum, stroke) => sum + stroke.points.length, 0)
  if (totalPoints < MIN_MEANINGFUL_POINTS) return false
  const bounds = strokeBounds(strokes)
  if (bounds === undefined) return false
  return bounds.width >= MIN_MEANINGFUL_EXTENT || bounds.height >= MIN_MEANINGFUL_EXTENT
}
