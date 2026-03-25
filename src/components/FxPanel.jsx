import { useState } from 'react'
import { EFFECT_DEFS, migrateParams } from '../utils/effects'

export default function FxPanel({ laneId, params, onUpdateParam, onAddEffect, onRemoveEffect }) {
  const [open, setOpen] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const effects = migrateParams(params)
  const activeTypes = new Set(effects.map(e => e.type))
  const available = Object.keys(EFFECT_DEFS).filter(t => !activeTypes.has(t))

  return (
    <div className="mt-2 pt-2 border-t border-zinc-800">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors select-none"
        >
          <span>{open ? '▼' : '▶'}</span>
          <span className="font-mono uppercase tracking-wider">FX</span>
        </button>
        {!open && (
          <span className="text-xs text-zinc-700 font-mono">
            {effects.map(e => EFFECT_DEFS[e.type]?.label ?? e.type).join(' · ')}
          </span>
        )}
      </div>

      {/* Expanded panel */}
      {open && (
        <div className="mt-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {effects.map(({ type, value }) => {
              const def = EFFECT_DEFS[type]
              if (!def) return null
              return (
                <div key={type} className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs text-zinc-500 font-mono w-10 flex-shrink-0">{def.label}</span>
                  <input
                    type="range"
                    min={def.min}
                    max={def.max}
                    step={def.step}
                    value={value}
                    onChange={e => onUpdateParam(laneId, type, Number(e.target.value))}
                    className="flex-1 h-1.5 appearance-none bg-zinc-700 rounded-full cursor-pointer accent-violet-500 min-w-0"
                  />
                  <span className="text-xs text-violet-400 tabular-nums w-10 text-right flex-shrink-0">
                    {def.format(value)}
                  </span>
                  <button
                    onClick={() => onRemoveEffect(laneId, type)}
                    className="text-zinc-700 hover:text-red-400 transition-colors flex-shrink-0 text-sm leading-none"
                    title={`Remove ${def.label}`}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>

          {/* Add effect */}
          {available.length > 0 && (
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              {showPicker ? (
                <>
                  {available.map(type => (
                    <button
                      key={type}
                      onClick={() => { onAddEffect(laneId, type); setShowPicker(false) }}
                      className="px-2 py-0.5 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 rounded transition-colors border border-zinc-700"
                    >
                      {EFFECT_DEFS[type].label}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowPicker(false)}
                    className="text-xs text-zinc-600 hover:text-zinc-400 px-1"
                  >✕</button>
                </>
              ) : (
                <button
                  onClick={() => setShowPicker(true)}
                  className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors font-mono"
                >
                  + add effect
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
