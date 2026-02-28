import { useState, useRef } from 'react'
import ParamSlider from './ParamSlider'
import { generatePattern } from '../utils/claude'

export default function Lane({ lane, onRemove, onUpdateParam, onUpdateCode, onUpdatePromptAndCode, onToggleMute, onToggleSolo }) {
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

  // Keep local values in sync when lane prop changes (e.g. from URL hydration)
  const prevBaseCode = useRef(lane.baseCode)
  if (lane.baseCode !== prevBaseCode.current) {
    prevBaseCode.current = lane.baseCode
    setCodeValue(lane.baseCode)
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
      const { code: newCode, analysis } = await generatePattern(prompt, setRegenStep)
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
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 transition-opacity ${isMuted ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Left: emoji + name */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <span className="text-2xl select-none">{lane.emoji}</span>
          {editingName ? (
            <input
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={e => e.key === 'Enter' && handleNameBlur()}
              className="bg-zinc-800 border border-zinc-600 rounded px-1.5 py-0.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500 w-28"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors text-left truncate max-w-24"
              title="Click to edit name"
            >
              {lane.name}
            </button>
          )}
        </div>

        {/* Center: code preview */}
        <div className="flex-1 min-w-0">
          {editingCode ? (
            <textarea
              value={codeValue}
              onChange={e => handleCodeChange(e.target.value)}
              onBlur={() => setEditingCode(false)}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-xs text-green-400 font-mono focus:outline-none focus:border-violet-500 resize-none"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditingCode(true)}
              className="w-full text-left text-xs text-green-400 font-mono bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg px-3 py-2 truncate transition-colors"
              title="Click to edit code"
            >
              {lane.baseCode}
            </button>
          )}
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onToggleMute(lane.id)}
            className={`px-2 py-1 rounded text-xs font-mono font-bold transition-colors ${
              isMuted
                ? 'bg-zinc-600 text-zinc-300'
                : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'
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
                : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'
            }`}
            title="Solo"
          >
            S
          </button>
          <button
            onClick={() => onRemove(lane.id)}
            className="px-2 py-1 rounded text-xs font-mono text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors"
            title="Delete lane"
          >
            ×
          </button>
        </div>
      </div>

      {/* Prompt edit row */}
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
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 disabled:opacity-50"
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
            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors group"
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
            {lane.analysis.key && (
              <span className="text-xs text-zinc-600">{lane.analysis.key}</span>
            )}
            {lane.analysis.rhythm && (
              <span className="text-xs text-zinc-700">· {lane.analysis.rhythm}</span>
            )}
            {lane.analysis.character && (
              <span className="text-xs text-zinc-700">· {lane.analysis.character}</span>
            )}
          </div>
        )}
      </div>

      {/* Param sliders */}
      <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-zinc-800">
        <ParamSlider
          label="gain"
          value={lane.params.gain}
          min={0} max={1} step={0.01}
          onChange={v => onUpdateParam(lane.id, 'gain', v)}
        />
        <ParamSlider
          label="lpf"
          value={lane.params.lpf}
          min={200} max={8000} step={10}
          format={v => `${Math.round(v)}Hz`}
          onChange={v => onUpdateParam(lane.id, 'lpf', v)}
        />
        <ParamSlider
          label="room"
          value={lane.params.room}
          min={0} max={1} step={0.01}
          onChange={v => onUpdateParam(lane.id, 'room', v)}
        />
        <ParamSlider
          label="delay"
          value={lane.params.delay}
          min={0} max={0.8} step={0.01}
          onChange={v => onUpdateParam(lane.id, 'delay', v)}
        />
      </div>
    </div>
  )
}
