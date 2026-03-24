import { useState, useRef } from 'react'
import { INSTRUMENT_GROUPS, chordToFrets, CHORD_MODIFIERS } from '../utils/guitarTab'

// Strings displayed high→low (top to bottom), stored low→high (index 0 = low E)
const DISPLAY_ORDER = [5, 4, 3, 2, 1, 0]
const DISPLAY_NAMES = ['e', 'B', 'G', 'D', 'A', 'E']
const ROOT_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

export default function GuitarTabLane({ lane, onUpdateTabCell, onUpdateTabColumn, onUpdateTabInstrument }) {
  const { pattern } = lane
  const { tab, instrument } = pattern
  const steps = tab.length

  const [activeColumn, setActiveColumn] = useState(0)
  const [chordRoot, setChordRoot] = useState('C')
  const [chordModifier, setChordModifier] = useState('maj')

  // 2D ref grid: inputRefs[displayIdx][stepIndex]
  const inputRefs = useRef([])
  DISPLAY_ORDER.forEach((_, di) => {
    if (!inputRefs.current[di]) inputRefs.current[di] = []
  })

  const handleKeyDown = (e, displayIdx, stepIndex) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    let di = displayIdx
    let si = stepIndex
    if (e.key === 'ArrowRight') si = Math.min(steps - 1, si + 1)
    else if (e.key === 'ArrowLeft') si = Math.max(0, si - 1)
    else if (e.key === 'ArrowDown') di = Math.min(DISPLAY_ORDER.length - 1, di + 1)
    else if (e.key === 'ArrowUp') di = Math.max(0, di - 1)
    inputRefs.current[di]?.[si]?.focus()
    setActiveColumn(si)
  }

  const handleCellChange = (stepIndex, stringIndex, value) => {
    if (value === '' || value === '-' || value === 'x') {
      onUpdateTabCell(lane.id, stepIndex, stringIndex, -1)
    } else {
      const n = parseInt(value)
      if (!isNaN(n) && n >= 0 && n <= 22) {
        onUpdateTabCell(lane.id, stepIndex, stringIndex, n)
      }
    }
  }

  const handleInsertChord = () => {
    const frets = chordToFrets(chordRoot, chordModifier)
    if (!frets) return
    onUpdateTabColumn(lane.id, activeColumn, frets)
    const next = Math.min(steps - 1, activeColumn + 1)
    setActiveColumn(next)
    inputRefs.current[0]?.[next]?.focus()
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Instrument selector */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-zinc-600 font-mono">inst</span>
        <select
          value={instrument}
          onChange={e => onUpdateTabInstrument(lane.id, e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-violet-500 cursor-pointer"
        >
          {INSTRUMENT_GROUPS.map(group => (
            <optgroup key={group.label} label={group.label}>
              {group.instruments.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Tab grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0.5">

          {/* String rows — high e at top, low E at bottom */}
          {DISPLAY_ORDER.map((stringIdx, displayIdx) => (
            <div key={stringIdx} className="flex items-center gap-0.5">
              <span className="text-[10px] text-zinc-500 font-mono w-4 text-right flex-shrink-0 select-none">
                {DISPLAY_NAMES[displayIdx]}
              </span>
              <span className="text-zinc-700 font-mono text-xs mx-0.5">|</span>
              {tab.map((column, stepIndex) => {
                const fret = column[stringIdx]
                const isActive = stepIndex === activeColumn
                return (
                  <input
                    key={stepIndex}
                    ref={el => { inputRefs.current[displayIdx][stepIndex] = el }}
                    type="text"
                    value={fret >= 0 ? String(fret) : ''}
                    onChange={e => handleCellChange(stepIndex, stringIdx, e.target.value)}
                    onKeyDown={e => handleKeyDown(e, displayIdx, stepIndex)}
                    onFocus={() => setActiveColumn(stepIndex)}
                    placeholder="·"
                    maxLength={2}
                    className={`w-8 h-6 text-center text-xs font-mono rounded border focus:outline-none transition-colors placeholder-zinc-800${
                      stepIndex > 0 && stepIndex % 4 === 0 ? ' ml-1' : ''
                    } ${
                      fret >= 0
                        ? 'bg-violet-900/40 border-violet-700/60 text-violet-300'
                        : isActive
                          ? 'bg-zinc-800/40 border-amber-700/50 text-zinc-500'
                          : 'bg-zinc-800/40 border-zinc-800 text-zinc-500'
                    } ${isActive ? 'focus:border-amber-400' : 'focus:border-violet-500'}`}
                  />
                )
              })}
            </div>
          ))}

        </div>
      </div>

      {/* Chord picker */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] text-zinc-600 font-mono">chord</span>
        <select
          value={chordRoot}
          onChange={e => setChordRoot(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-violet-500 cursor-pointer"
        >
          {ROOT_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select
          value={chordModifier}
          onChange={e => setChordModifier(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-violet-500 cursor-pointer"
        >
          {CHORD_MODIFIERS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <button
          onClick={handleInsertChord}
          className="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-mono transition-colors"
        >
          + col {activeColumn + 1}
        </button>
      </div>
    </div>
  )
}
