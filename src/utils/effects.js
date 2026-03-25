export const EFFECT_DEFS = {
  gain:    { label: 'Gain',    method: 'gain',    min: 0,    max: 1,    step: 0.01, default: 0.8,  format: v => v.toFixed(2) },
  lpf:     { label: 'LPF',     method: 'lpf',     min: 200,  max: 8000, step: 10,   default: 4000, format: v => `${Math.round(v)}Hz` },
  hpf:     { label: 'HPF',     method: 'hpf',     min: 20,   max: 4000, step: 10,   default: 200,  format: v => `${Math.round(v)}Hz` },
  room:    { label: 'Room',    method: 'room',    min: 0,    max: 1,    step: 0.01, default: 0.2,  format: v => v.toFixed(2) },
  delay:   { label: 'Delay',   method: 'delay',   min: 0,    max: 0.8,  step: 0.01, default: 0.2,  format: v => v.toFixed(2) },
  pan:     { label: 'Pan',     method: 'pan',     min: -1,   max: 1,    step: 0.01, default: 0,    format: v => v.toFixed(2) },
  speed:   { label: 'Speed',   method: 'speed',   min: 0.1,  max: 4,    step: 0.05, default: 1,    format: v => `${v.toFixed(2)}x` },
  crush:   { label: 'Crush',   method: 'crush',   min: 1,    max: 16,   step: 1,    default: 8,    format: v => `${Math.round(v)}bit` },
  distort: { label: 'Distort', method: 'distort', min: 0,    max: 1,    step: 0.01, default: 0.3,  format: v => v.toFixed(2) },
}

export const DEFAULT_EFFECTS = [
  { type: 'gain',  value: 0.8 },
  { type: 'lpf',   value: 4000 },
  { type: 'room',  value: 0.2 },
  { type: 'delay', value: 0.0 },
]

// Converts old { gain, lpf, room, delay } object → new array format
export function migrateParams(params) {
  if (Array.isArray(params)) return params
  if (!params || typeof params !== 'object') return [...DEFAULT_EFFECTS]
  return [
    { type: 'gain',  value: params.gain  ?? 0.8 },
    { type: 'lpf',   value: params.lpf   ?? 4000 },
    { type: 'room',  value: params.room  ?? 0.2 },
    { type: 'delay', value: params.delay ?? 0.0 },
  ]
}

export function buildEffectsChain(params, globalLpf = 8000) {
  return params.map(({ type, value }) => {
    const def = EFFECT_DEFS[type]
    if (!def) return ''
    if (type === 'lpf') {
      const capped = Math.min(Math.round(globalLpf), Math.round(value))
      return `.lpf(${capped})`
    }
    if (type === 'crush') return `.crush(${Math.round(value)})`
    if (type === 'hpf')   return `.hpf(${Math.round(value)})`
    return `.${def.method}(${value.toFixed(2)})`
  }).join('')
}
