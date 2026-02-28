import { useState, useRef } from 'react'
import ParamSlider from './ParamSlider'

export default function Lane({ lane, onRemove, onUpdateParam, onUpdateCode, onToggleMute, onToggleSolo }) {
  const [editingName, setEditingName] = useState(false)
  const [editingCode, setEditingCode] = useState(false)
  const [nameValue, setNameValue] = useState(lane.name)
  const [codeValue, setCodeValue] = useState(lane.baseCode)
  const codeDebounce = useRef(null)

  const handleNameBlur = () => {
    setEditingName(false)
    if (nameValue.trim() !== lane.name) {
      // Name update would need to propagate up; for now just keep local
    }
  }

  const handleCodeChange = (val) => {
    setCodeValue(val)
    clearTimeout(codeDebounce.current)
    codeDebounce.current = setTimeout(() => {
      onUpdateCode(lane.id, val)
    }, 500)
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
