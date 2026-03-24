// Standard tuning: low E to high e
export const STANDARD_TUNING = ['e2', 'a2', 'd3', 'g3', 'b3', 'e4']

// Display names low→high (bottom→top in UI)
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e']

// Grouped for the instrument dropdown
export const INSTRUMENT_GROUPS = [
  {
    label: 'Guitar / String',
    // pluck = Karplus-Strong synthesis (best acoustic guitar simulation)
    // gtr = 3 sampled electric guitar notes
    instruments: ['pluck', 'gtr', 'sitar']
  },
  {
    label: 'Bass',
    instruments: ['bass', 'jvbass']
  },
  {
    label: 'Keys / Melodic',
    instruments: ['arpy', 'moog', 'juno', 'jazz']
  },
  {
    label: 'Synth',
    instruments: ['sawtooth', 'square', 'triangle', 'sine', 'supersaw', 'pulse']
  }
]

const CHROMATIC = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']
// Map flat names (from the key selector) to their sharp equivalents
const ENHARMONIC = { 'Eb': 'D#', 'Ab': 'G#', 'Bb': 'A#' }

function noteToMidi(note) {
  const name = note.slice(0, -1)
  const octave = parseInt(note.slice(-1))
  return (octave + 1) * 12 + CHROMATIC.indexOf(name)
}

function midiToNote(midi) {
  const octave = Math.floor(midi / 12) - 1
  return CHROMATIC[midi % 12] + octave
}

export function fretToNote(stringIndex, fret) {
  return midiToNote(noteToMidi(STANDARD_TUNING[stringIndex]) + fret)
}

export const CHORD_MODIFIERS = ['maj', 'min', '7', 'maj7', 'min7', 'sus2', 'sus4', 'add9', 'aug', 'dim', '6', 'min6', '9']

// Fret offsets relative to root fret — E-shape barre (root on string 0, low E)
const E_SHAPE = {
  'maj':  [0,  2,  2,  1,  0,  0],
  'min':  [0,  2,  2,  0,  0,  0],
  '7':    [0,  2,  0,  1,  0,  0],
  'maj7': [0,  2,  1,  1,  0,  0],
  'min7': [0,  2,  0,  0,  0,  0],
  'sus2': [0,  2,  4,  4,  0,  0],
  'sus4': [0,  2,  2,  2,  0,  0],
  'add9': [0,  2,  2,  1,  0,  2],
  'aug':  [0,  3,  2,  1,  1,  0],
  'dim':  [0,  1,  2,  0, -1, -1],
  '6':    [0,  2,  2,  1,  2,  0],
  'min6': [0,  2,  2,  0,  2,  0],
  '9':    [0,  2,  0,  1,  0,  2],
}

// Fret offsets relative to root fret — A-shape barre (root on string 1, string 0 muted)
const A_SHAPE = {
  'maj':  [-1, 0,  2,  2,  2,  0],
  'min':  [-1, 0,  2,  2,  1,  0],
  '7':    [-1, 0,  2,  0,  2,  0],
  'maj7': [-1, 0,  2,  1,  2,  0],
  'min7': [-1, 0,  2,  0,  1,  0],
  'sus2': [-1, 0,  2,  2,  0,  0],
  'sus4': [-1, 0,  2,  2,  3,  0],
  'add9': [-1, 0,  2,  4,  2,  0],
  'aug':  [-1, 0,  3,  2,  2,  1],
  'dim':  [-1, 0,  1,  2,  1, -1],
  '6':    [-1, 0,  2,  2,  2,  2],
  'min6': [-1, 0,  2,  2,  1,  2],
  '9':    [-1, 0,  2,  0,  2,  2],
}

// Returns fret array [6] for a given root + chord modifier.
// Uses E-shape barre when root falls on frets 0–7 of low E, otherwise A-shape.
export function chordToFrets(rootName, modifier) {
  const normalized = (ENHARMONIC[rootName] || rootName).toLowerCase()
  const rootIdx = CHROMATIC.indexOf(normalized)
  if (rootIdx === -1) return null

  const eFret = (rootIdx - noteToMidi(STANDARD_TUNING[0]) % 12 + 12) % 12
  const aFret = (rootIdx - noteToMidi(STANDARD_TUNING[1]) % 12 + 12) % 12

  const useEShape = eFret <= 7
  const shape = (useEShape ? E_SHAPE : A_SHAPE)[modifier]
  if (!shape) return null

  const rootFret = useEShape ? eFret : aFret
  return shape.map(offset => offset === -1 ? -1 : rootFret + offset)
}

export function tabPatternToStrudel(pattern) {
  const { tab, instrument } = pattern
  const steps = tab.map(column => {
    const notes = column
      .map((fret, si) => fret >= 0 ? fretToNote(si, fret) : null)
      .filter(Boolean)
    if (notes.length === 0) return '~'
    if (notes.length === 1) return notes[0]
    return `[${notes.join(',')}]`
  })
  return `note("${steps.join(' ')}").s("${instrument}")`
}

// Returns a tab column with the root note on the lowest comfortable string (frets 0–7).
// Falls back to frets 0–12 if nothing fits in 0–7.
export function defaultChordForRoot(rootName) {
  const normalized = (ENHARMONIC[rootName] || rootName).toLowerCase()
  const rootIdx = CHROMATIC.indexOf(normalized)
  if (rootIdx === -1) return Array(6).fill(-1)

  const tab = Array(6).fill(-1)
  for (const maxFret of [7, 12]) {
    for (let si = 0; si < 6; si++) {
      const openIdx = noteToMidi(STANDARD_TUNING[si]) % 12
      const fret = (rootIdx - openIdx + 12) % 12
      if (fret <= maxFret) {
        tab[si] = fret
        return tab
      }
    }
  }
  return tab
}

export const DEFAULT_TAB_PATTERN = {
  instrument: 'pluck',
  tuning: STANDARD_TUNING,
  steps: 8,
  // Start with E major in step 0 as a helpful example, rest empty
  tab: [
    [0, 2, 2, 1, 0, 0],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
  ]
}
