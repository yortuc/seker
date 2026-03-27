import { useState, useRef } from 'react'
import DrumLane from './DrumLane'
import GuitarTabLane from './GuitarTabLane'
import NoteGridLane from './NoteGridLane'
import FxPanel from './FxPanel'
import { usePlayhead } from '../hooks/usePlayhead'

export default function Lane({
  lane,
  isPlaying,
  onLog,
  generateFn,
  onRemove,
  onDuplicate,
  onUpdateParam,
  onAddEffect,
  onRemoveEffect,
  onUpdateCode,
  onUpdatePromptAndCode,
  onToggleMute,
  onToggleSolo,
  onToggleDrumStep,
  onAddDrumTrack,
  onRemoveDrumTrack,
  onUpdateTabCell,
  onUpdateTabColumn,
  onUpdateTabInstrument,
  onToggleNoteGridCell,
  onSetNoteGridCell,
  onUpdateNoteGridInstrument,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editingCode, setEditingCode] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState(false)
  const [nameValue, setNameValue] = useState(lane.name)
  const [codeValue, setCodeValue] = useState(lane.baseCode)
  const [promptValue, setPromptValue] = useState(lane.prompt || '')
  const [regenerating, setRegenerating] = useState(false)
  const [regenStep, setRegenStep] = useState('')
  const [regenError, setRegenError] = useState(null)
  const codeDebounce = useRef(null)

  const laneType = lane.type ?? 'strudel'

  // Step metadata for collapsed beat strip
  const numSteps = laneType === 'drum' ? lane.pattern.steps
    : laneType === 'notegrid' ? lane.pattern.steps
    : laneType === 'instrument' ? lane.pattern.tab.length
    : 16

  const activeSteps = (() => {
    if (laneType === 'drum') {
      return Array.from({ length: numSteps }, (_, i) =>
        lane.pattern.tracks.some(t => t.steps[i])
      )
    }
    if (laneType === 'notegrid') {
      return Array.from({ length: numSteps }, (_, i) =>
        lane.pattern.grid?.some(row => row[i])
      )
    }
    return Array(numSteps).fill(false)
  })()

  const currentStep = usePlayhead(isPlaying, numSteps)

  // Sync codeValue when baseCode changes externally (URL hydration) — strudel only
  const prevBaseCode = useRef(lane.baseCode)
  if (lane.baseCode !== prevBaseCode.current) {
    prevBaseCode.current = lane.baseCode
    if (laneType === 'strudel') setCodeValue(lane.baseCode)
  }

  const handleNameBlur = () => setEditingName(false)

  const handleCodeChange = (val) => {
    setCodeValue(val)
    clearTimeout(codeDebounce.current)
    codeDebounce.current = setTimeout(() => onUpdateCode(lane.id, val), 500)
  }

  const handleRegenerate = async () => {
    const prompt = promptValue.trim()
    if (!prompt) return
    setRegenerating(true)
    setRegenStep('')
    setRegenError(null)
    try {
      const { code: newCode, analysis } = await generateFn(prompt, setRegenStep, null, onLog)
      onUpdatePromptAndCode(lane.id, prompt, newCode, analysis)
      setCodeValue(newCode)
      setEditingPrompt(false)
    } catch (err) {
      setRegenError(err.message)
    } finally {
      setRegenerating(false)
      setRegenStep('')
    }
  }

  const isMuted = lane.muted
  const isSolo = lane.solo

  return (
    <div className={`bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-xl p-4 transition-opacity ${isMuted ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">

        {/* Left: emoji + name + collapse toggle */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <button
            onClick={() => setCollapsed(v => !v)}
            className="text-zinc-600 light:text-zinc-400 hover:text-zinc-300 light:hover:text-zinc-700 transition-colors text-xs leading-none flex-shrink-0"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▶' : '▼'}
          </button>
          <span className="text-2xl select-none">{lane.emoji}</span>
          {editingName && !collapsed ? (
            <input
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={e => e.key === 'Enter' && handleNameBlur()}
              className="bg-zinc-800 light:bg-zinc-100 border border-zinc-600 light:border-zinc-300 rounded px-1.5 py-0.5 text-sm text-zinc-100 light:text-zinc-900 focus:outline-none focus:border-violet-500 w-28"
              autoFocus
            />
          ) : (
            <button
              onClick={() => !collapsed && setEditingName(true)}
              className="text-sm font-medium text-zinc-300 light:text-zinc-700 hover:text-zinc-100 light:hover:text-zinc-900 transition-colors text-left truncate max-w-24"
              title={collapsed ? undefined : 'Click to edit name'}
            >
              {lane.name}
            </button>
          )}
        </div>

        {/* Center: collapsed beat strip or expanded type-specific content */}
        {collapsed ? (
          <div className="flex-1 flex items-center gap-px min-w-0">
            {Array.from({ length: numSteps }, (_, i) => {
              const isCurrentStep = i === currentStep
              const hasActivity = activeSteps[i]
              return (
                <div
                  key={i}
                  className={`flex-1 h-5 rounded-sm transition-colors ${
                    i > 0 && i % 4 === 0 ? 'ml-0.5' : ''
                  } ${
                    hasActivity
                      ? isCurrentStep ? 'bg-white' : 'bg-violet-700'
                      : isCurrentStep ? 'bg-zinc-600 light:bg-zinc-400' : 'bg-zinc-800 light:bg-zinc-200'
                  }`}
                />
              )
            })}
          </div>
        ) : laneType === 'drum' ? (
          <DrumLane
            lane={lane}
            currentStep={currentStep}
            onToggleStep={onToggleDrumStep}
            onAddTrack={onAddDrumTrack}
            onRemoveTrack={onRemoveDrumTrack}
          />
        ) : laneType === 'instrument' ? (
          <GuitarTabLane
            lane={lane}
            currentStep={currentStep}
            onUpdateTabCell={onUpdateTabCell}
            onUpdateTabColumn={onUpdateTabColumn}
            onUpdateTabInstrument={onUpdateTabInstrument}
          />
        ) : laneType === 'notegrid' ? (
          <NoteGridLane
            lane={lane}
            currentStep={currentStep}
            onToggleCell={onToggleNoteGridCell}
            onSetCell={onSetNoteGridCell}
            onChangeInstrument={onUpdateNoteGridInstrument}
          />
        ) : (
          <div className="flex-1 min-w-0">
            {editingCode ? (
              <textarea
                value={codeValue}
                onChange={e => handleCodeChange(e.target.value)}
                onBlur={() => setEditingCode(false)}
                rows={2}
                className="w-full bg-zinc-800 light:bg-zinc-100 border border-zinc-600 light:border-zinc-300 rounded-lg px-3 py-2 text-xs text-green-400 light:text-green-700 font-mono focus:outline-none focus:border-violet-500 resize-none"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setEditingCode(true)}
                className="w-full text-left text-xs text-green-400 light:text-green-700 font-mono bg-zinc-800/50 light:bg-zinc-100/50 hover:bg-zinc-800 light:hover:bg-zinc-100 border border-zinc-800 light:border-zinc-200 hover:border-zinc-700 light:hover:border-zinc-300 rounded-lg px-3 py-2 truncate transition-colors"
                title="Click to edit code"
              >
                {lane.baseCode}
              </button>
            )}
          </div>
        )}

        {/* Right: controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onToggleMute(lane.id)}
            className={`px-2 py-1 rounded text-xs font-mono font-bold transition-colors ${
              isMuted
                ? 'bg-zinc-600 light:bg-zinc-400 text-zinc-300 light:text-zinc-700'
                : 'bg-zinc-800 light:bg-zinc-100 text-zinc-500 hover:text-zinc-300 light:hover:text-zinc-700 hover:bg-zinc-700 light:hover:bg-zinc-200'
            }`}
            title="Mute"
          >
            M
          </button>
          <button
            onClick={() => onToggleSolo(lane.id)}
            className={`px-2 py-1 rounded text-xs font-mono font-bold transition-colors ${
              isSolo
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-800 light:bg-zinc-100 text-zinc-500 hover:text-zinc-300 light:hover:text-zinc-700 hover:bg-zinc-700 light:hover:bg-zinc-200'
            }`}
            title="Solo"
          >
            S
          </button>
          <button
            onClick={() => onDuplicate(lane.id)}
            className="px-2 py-1 rounded text-xs font-mono text-zinc-600 light:text-zinc-400 hover:text-zinc-300 light:hover:text-zinc-700 hover:bg-zinc-800 light:hover:bg-zinc-100 transition-colors"
            title="Duplicate lane"
          >
            ⧉
          </button>
          <button
            onClick={() => onRemove(lane.id)}
            className="px-2 py-1 rounded text-xs font-mono text-zinc-600 light:text-zinc-400 hover:text-red-400 hover:bg-zinc-800 light:hover:bg-zinc-100 transition-colors"
            title="Delete lane"
          >
            ×
          </button>
        </div>
      </div>

      {/* Prompt / analysis row — strudel only, hidden when collapsed */}
      {!collapsed && (laneType === 'strudel' || laneType == null) && (
        <div className="mt-2">
          {editingPrompt ? (
            <div className="flex gap-2 items-center">
              <input
                value={promptValue}
                onChange={e => setPromptValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRegenerate()
                  if (e.key === 'Escape') setEditingPrompt(false)
                }}
                disabled={regenerating}
                className="flex-1 bg-zinc-800 light:bg-zinc-100 border border-zinc-700 light:border-zinc-300 rounded-lg px-3 py-1.5 text-xs text-zinc-100 light:text-zinc-900 placeholder-zinc-600 focus:outline-none focus:border-violet-500 disabled:opacity-50"
                autoFocus
              />
              <button
                onClick={handleRegenerate}
                disabled={regenerating || !promptValue.trim()}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                {regenerating ? (
                  <>
                    <span className="inline-block w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {regenStep || 'Working…'}
                  </>
                ) : '↺ Regenerate'}
              </button>
              <button
                onClick={() => { setEditingPrompt(false); setRegenError(null) }}
                className="text-xs text-zinc-600 hover:text-zinc-400 px-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingPrompt(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-600 light:text-zinc-500 hover:text-zinc-400 transition-colors group"
            >
              <span className="group-hover:text-violet-500 transition-colors">↺</span>
              <span className="truncate max-w-xs italic">
                {lane.prompt || 'edit prompt to regenerate…'}
              </span>
            </button>
          )}
          {regenError && (
            <p className="mt-1 text-xs text-red-400">{regenError}</p>
          )}
          {!editingPrompt && lane.analysis && (lane.analysis.key || lane.analysis.rhythm || lane.analysis.character) && (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
              {lane.analysis.key && <span className="text-xs text-zinc-600">{lane.analysis.key}</span>}
              {lane.analysis.rhythm && <span className="text-xs text-zinc-700">· {lane.analysis.rhythm}</span>}
              {lane.analysis.character && <span className="text-xs text-zinc-700">· {lane.analysis.character}</span>}
            </div>
          )}
        </div>
      )}

      {/* FX panel — hidden when collapsed */}
      {!collapsed && (
        <FxPanel
          laneId={lane.id}
          params={lane.params}
          onUpdateParam={onUpdateParam}
          onAddEffect={onAddEffect}
          onRemoveEffect={onRemoveEffect}
        />
      )}
    </div>
  )
}
