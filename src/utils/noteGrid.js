const CHROMATIC = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']

const IS_SHARP = new Set(['c#', 'd#', 'f#', 'g#', 'a#'])

// Build note list from highOctave down to lowOctave (top = high pitch, for UI row order)
export function buildNotes(lowOctave = 3, highOctave = 4) {
  const notes = []
  for (let oct = highOctave; oct >= lowOctave; oct--) {
    for (let i = CHROMATIC.length - 1; i >= 0; i--) {
      notes.push({ note: CHROMATIC[i] + oct, isSharp: IS_SHARP.has(CHROMATIC[i]) })
    }
  }
  return notes
}

export function isOctaveRoot(noteStr) {
  // e.g. "c4", "c3"
  return noteStr.startsWith('c') && !noteStr.startsWith('c#')
}

export function noteLabel(noteObj) {
  const name = noteObj.note
  // show octave number only on C notes
  if (isOctaveRoot(name)) return name.toUpperCase()   // e.g. "C4"
  const letter = name.slice(0, -1)                     // strip octave digit
  if (letter === 'c#') return 'C#'
  if (letter === 'd#') return 'D#'
  if (letter === 'f#') return 'F#'
  if (letter === 'g#') return 'G#'
  if (letter === 'a#') return 'A#'
  return letter.toUpperCase()                          // e.g. "D"
}

export const MELODY_INSTRUMENTS = ['arpy', 'piano', 'moog', 'juno', 'jazz', 'sine', 'sawtooth', 'triangle', 'supersaw', 'pluck']

export const DEFAULT_NOTE_GRID = {
  steps: 16,
  lowOctave: 3,
  highOctave: 4,
  instrument: 'arpy',
  // grid[noteIndex][stepIndex] = 0|1, row 0 = highest note
  grid: null  // generated at lane creation time
}

export function makeEmptyGrid(lowOctave, highOctave, steps) {
  const noteCount = (highOctave - lowOctave + 1) * 12
  return Array.from({ length: noteCount }, () => Array(steps).fill(0))
}

export function noteGridToStrudel(pattern) {
  const notes = buildNotes(pattern.lowOctave, pattern.highOctave)
  const { grid, steps, instrument } = pattern

  const stepTokens = []
  for (let step = 0; step < steps; step++) {
    const active = []
    for (let ni = 0; ni < notes.length; ni++) {
      if (grid[ni]?.[step]) active.push(notes[ni].note)
    }
    if (active.length === 0) stepTokens.push('~')
    else if (active.length === 1) stepTokens.push(active[0])
    else stepTokens.push(`[${active.join(',')}]`)
  }

  return `note("${stepTokens.join(' ')}").s("${instrument}")`
}
