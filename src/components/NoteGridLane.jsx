import { useState, useRef, useCallback, useEffect } from 'react'
import { buildNotes, noteLabel, isOctaveRoot, MELODY_INSTRUMENTS } from '../utils/noteGrid'

const BASE_CELL_W = 18   // px at zoom 1
const BASE_CELL_H = 11   // px at zoom 1
const LABEL_W = 28       // px, fixed
const MIN_ZOOM = 0.5
const MAX_ZOOM = 4
const ZOOM_STEP = 0.25

export default function NoteGridLane({ lane, currentStep, onToggleCell, onSetCell, onChangeInstrument }) {
  const { pattern } = lane
  const notes = buildNotes(pattern.lowOctave, pattern.highOctave)
  const [showInstruments, setShowInstruments] = useState(false)
  const [zoom, setZoom] = useState(1.5)
  const paintRef = useRef(null) // { value: 0|1 } while dragging
  const containerRef = useRef(null)

  const cellW = Math.round(BASE_CELL_W * zoom)
  const cellH = Math.max(6, Math.round(BASE_CELL_H * zoom))
  const fontSize = Math.max(7, Math.round(9 * zoom))

  // Ctrl/Cmd+scroll to zoom
  const handleWheel = useCallback((e) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(z + delta).toFixed(2))))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Global mouseup to end painting
  useEffect(() => {
    const stop = () => { paintRef.current = null }
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [])

  const handleCellMouseDown = (noteIndex, stepIndex) => {
    const cur = pattern.grid[noteIndex]?.[stepIndex] ?? 0
    const next = cur ? 0 : 1
    paintRef.current = { value: next }
    onSetCell(lane.id, noteIndex, stepIndex, next)
  }

  const handleCellMouseEnter = (noteIndex, stepIndex) => {
    if (!paintRef.current) return
    onSetCell(lane.id, noteIndex, stepIndex, paintRef.current.value)
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-1.5">
        {/* Instrument picker */}
        {showInstruments ? (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-zinc-600 font-mono">sound:</span>
            {MELODY_INSTRUMENTS.map(inst => (
              <button
                key={inst}
                onClick={() => { onChangeInstrument(lane.id, inst); setShowInstruments(false) }}
                className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                  inst === pattern.instrument
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 light:bg-zinc-100 hover:bg-zinc-700 light:hover:bg-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-zinc-100 light:hover:text-zinc-900'
                }`}
              >
                {inst}
              </button>
            ))}
            <button onClick={() => setShowInstruments(false)} className="text-xs text-zinc-600 hover:text-zinc-400 px-1">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setShowInstruments(true)}
            className="text-xs text-zinc-600 light:text-zinc-500 hover:text-zinc-400 font-mono transition-colors"
          >
            {pattern.instrument} ▾
          </button>
        )}

        {/* Zoom controls */}
        <div className="flex items-center gap-1 ml-auto select-none">
          <button
            onClick={() => setZoom(z => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
            className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-200 light:hover:text-zinc-700 bg-zinc-800 light:bg-zinc-100 hover:bg-zinc-700 light:hover:bg-zinc-200 rounded text-xs transition-colors"
          >−</button>
          <span className="text-xs font-mono text-zinc-600 light:text-zinc-500 w-8 text-center">{zoom}×</span>
          <button
            onClick={() => setZoom(z => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
            className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-200 light:hover:text-zinc-700 bg-zinc-800 light:bg-zinc-100 hover:bg-zinc-700 light:hover:bg-zinc-200 rounded text-xs transition-colors"
          >+</button>
        </div>
      </div>

      {/* Grid */}
      <div ref={containerRef} className="overflow-x-auto overflow-y-visible cursor-crosshair select-none">
        <div
          className="inline-block border-t border-l border-zinc-800 light:border-zinc-200"
          style={{ userSelect: 'none' }}
        >
          {notes.map((noteObj, noteIndex) => {
            const isRoot = isOctaveRoot(noteObj.note)
            const isSharp = noteObj.isSharp

            return (
              <div key={noteObj.note} className="flex" style={{ height: cellH }}>
                {/* Piano key label */}
                <div
                  className={`flex-shrink-0 flex items-center justify-end pr-1 border-r border-b border-zinc-800 light:border-zinc-200 ${
                    isSharp ? 'bg-zinc-900 light:bg-zinc-100' : 'bg-zinc-950 light:bg-white'
                  } ${isRoot ? 'border-t border-t-violet-900/50 light:border-t-violet-300/50' : ''}`}
                  style={{ width: LABEL_W, height: cellH, fontSize }}
                >
                  <span className={`font-mono leading-none ${
                    isRoot ? 'text-violet-400' : isSharp ? 'text-zinc-700' : 'text-zinc-500'
                  }`}>
                    {noteLabel(noteObj)}
                  </span>
                </div>

                {/* Step cells */}
                {Array.from({ length: pattern.steps }, (_, stepIndex) => {
                  const active = pattern.grid[noteIndex]?.[stepIndex] === 1
                  const isBeatStart = stepIndex % 4 === 0
                  const isLastInGroup = stepIndex % 4 === 3
                  const isCurrentStep = stepIndex === currentStep

                  return (
                    <div
                      key={stepIndex}
                      onMouseDown={() => handleCellMouseDown(noteIndex, stepIndex)}
                      onMouseEnter={() => handleCellMouseEnter(noteIndex, stepIndex)}
                      className={`flex-shrink-0 border-b ${
                        isLastInGroup ? 'border-r border-r-zinc-700 light:border-r-zinc-300' : 'border-r border-r-zinc-800 light:border-r-zinc-200'
                      } ${
                        isBeatStart && stepIndex > 0 ? 'border-l border-l-zinc-700 light:border-l-zinc-300' : ''
                      } ${
                        active
                          ? isCurrentStep
                            ? 'bg-white'
                            : isRoot
                            ? 'bg-violet-500 hover:bg-violet-400'
                            : 'bg-emerald-500 hover:bg-emerald-400'
                          : isCurrentStep
                          ? isSharp ? 'bg-zinc-700 light:bg-zinc-300' : 'bg-zinc-800 light:bg-zinc-200'
                          : isSharp
                          ? 'bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200'
                          : 'bg-zinc-950 light:bg-white hover:bg-zinc-900 light:hover:bg-zinc-100'
                      } border-b-zinc-800 light:border-b-zinc-200`}
                      style={{ width: cellW, height: cellH }}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
