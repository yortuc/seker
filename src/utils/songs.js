const ADJECTIVES = [
  'Midnight', 'Copper', 'Velvet', 'Crimson', 'Golden', 'Silver', 'Amber',
  'Jade', 'Cobalt', 'Neon', 'Dusty', 'Hollow', 'Broken', 'Silent', 'Frozen',
  'Wild', 'Dark', 'Soft', 'Deep', 'Bright', 'Faded', 'Woven', 'Spare',
]

const NOUNS = [
  'Cascade', 'Pulse', 'Echo', 'Drift', 'Wave', 'Circuit', 'Signal', 'Bloom',
  'Loop', 'Fade', 'Surge', 'Frame', 'Grid', 'Phase', 'Veil', 'Storm',
  'Garden', 'Mirror', 'Ember', 'Shore', 'Orbit', 'Thread', 'Current', 'Rift',
]

export function generateSongName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `${adj} ${noun}`
}

export function loadSongs() {
  try {
    return JSON.parse(localStorage.getItem('seker-songs') || '[]')
  } catch {
    return []
  }
}

export function saveSong(name, state) {
  const songs = loadSongs()
  const existingIdx = songs.findIndex(s => s.name === name)
  const entry = { id: Date.now().toString(), name, savedAt: Date.now(), state }
  if (existingIdx >= 0) {
    songs[existingIdx] = entry
  } else {
    songs.unshift(entry)
  }
  localStorage.setItem('seker-songs', JSON.stringify(songs))
  return songs
}

export function deleteSong(id) {
  const songs = loadSongs().filter(s => s.id !== id)
  localStorage.setItem('seker-songs', JSON.stringify(songs))
  return songs
}

export function relativeTime(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
