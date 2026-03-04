export const ALL_DRUM_SOUNDS = ['bd', 'sd', 'hh', 'ho', 'cp', 'mt', 'ht', 'lt', 'rim', 'cb']

export const DEFAULT_DRUM_PATTERN = {
  steps: 16,
  tracks: [
    { sound: 'bd', steps: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0] },
    { sound: 'sd', steps: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0] },
    { sound: 'hh', steps: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0] },
    { sound: 'ho', steps: Array(16).fill(0) },
    { sound: 'cp', steps: Array(16).fill(0) },
  ]
}

export function drumPatternToStrudel(pattern) {
  const active = pattern.tracks.filter(t => t.steps.some(Boolean))
  if (active.length === 0) return 's("~")'
  const lines = active.map(t =>
    `s("${t.steps.map(v => v ? t.sound : '~').join(' ')}")`
  )
  return lines.length === 1 ? lines[0] : `stack(${lines.join(', ')})`
}
