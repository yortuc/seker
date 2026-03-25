export const ALL_DRUM_SOUNDS = ['bd', 'sd', 'hh', 'ho', 'cp', 'mt', 'ht', 'lt', 'rim', 'cb']

export const DRUM_KITS = [
  {
    id: 'standard',
    name: 'Standard',
    sounds: { bd: 'bd', sd: 'sd', hh: 'hh', ho: 'ho', cp: 'cp', mt: 'mt', ht: 'ht', lt: 'lt', rim: 'rim', cb: 'cb' },
  },
  {
    id: 'electronic',
    name: 'Electronic',
    sounds: { bd: 'bd:3', sd: 'sd:3', hh: 'hh:2', ho: 'ho:2', cp: 'cp:2', mt: 'mt:2', ht: 'ht:2', lt: 'lt:2', rim: 'rim:2', cb: 'cb:2' },
  },
  {
    id: 'lofi',
    name: 'Lo-fi',
    sounds: { bd: 'bd:5', sd: 'sd:5', hh: 'hh:3', ho: 'ho:3', cp: 'cp:3', mt: 'mt:4', ht: 'ht:3', lt: 'lt:2', rim: 'rim:3', cb: 'cb:2' },
  },
  {
    id: 'hard',
    name: 'Hard',
    sounds: { bd: 'bd:10', sd: 'sd:10', hh: 'hh:4', ho: 'ho:4', cp: 'cp:4', mt: 'mt:6', ht: 'ht:5', lt: 'lt:3', rim: 'rim:4', cb: 'cb:3' },
  },
]

export const DEFAULT_DRUM_PATTERN = {
  steps: 16,
  kitId: 'standard',
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
