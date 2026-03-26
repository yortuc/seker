// Bresenham-style euclidean rhythm: distributes `hits` as evenly as possible across `steps`
export function euclidean(hits, steps) {
  if (hits <= 0) return Array(steps).fill(0)
  if (hits >= steps) return Array(steps).fill(1)
  const pattern = []
  let bucket = 0
  for (let i = 0; i < steps; i++) {
    bucket += hits
    if (bucket >= steps) {
      bucket -= steps
      pattern.push(1)
    } else {
      pattern.push(0)
    }
  }
  return pattern
}

// Apply rotation (shift left by n)
export function rotate(pattern, n) {
  const len = pattern.length
  if (!len) return pattern
  const r = ((n % len) + len) % len
  return [...pattern.slice(r), ...pattern.slice(0, r)]
}

export function euclideanToStrudel(pattern) {
  const { sound, hits, steps, rotation } = pattern
  const rot = rotation > 0 ? `,${rotation}` : ''
  return `s("${sound}(${hits},${steps}${rot})")`
}

export const DEFAULT_EUCLIDEAN = {
  sound: 'bd',
  hits: 3,
  steps: 8,
  rotation: 0,
}
