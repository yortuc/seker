import { useState } from 'react'

const ROOT_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const SCALE_GROUPS = [
  { label: 'Western', scales: ['major', 'minor', 'dorian', 'phrygian', 'mixolydian', 'harmonic minor', 'pentatonic'] },
]

export default function Header({ isPlaying, isInitializing, bpm, globalLpf, globalKey, onPlay, onStop, onBpmChange, onGlobalLpfChange, onGlobalKeyChange, onNew, hasLanes, localMode, localModelProgress, webGPUAvailable, onToggleLocalMode }) {
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center gap-4">
        <div className="flex items-center gap-2 mr-2">
          <span className="text-violet-400 text-xl">♩</span>
          <h1 className="text-lg font-bold tracking-tight text-zinc-100">seker</h1>
          <span className="text-xs text-zinc-600 hidden sm:inline">llm music composer</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={isPlaying ? onStop : onPlay}
            disabled={isInitializing}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:cursor-not-allowed ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white'
            }`}
          >
            {isInitializing ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading samples...
              </>
            ) : isPlaying ? '■ Stop' : '▶ Play'}
          </button>
        </div>

        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-zinc-500 whitespace-nowrap">BPM</span>
          <input
            type="range"
            min={60}
            max={200}
            step={1}
            value={bpm}
            onChange={e => onBpmChange(Number(e.target.value))}
            className="w-24 h-1.5 appearance-none bg-zinc-700 rounded-full cursor-pointer accent-violet-500"
          />
          <span className="text-xs text-violet-400 tabular-nums w-7">{bpm}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 whitespace-nowrap">LPF</span>
          <input
            type="range"
            min={200}
            max={8000}
            step={50}
            value={globalLpf}
            onChange={e => onGlobalLpfChange(Number(e.target.value))}
            className="w-24 h-1.5 appearance-none bg-zinc-700 rounded-full cursor-pointer accent-emerald-500"
          />
          <span className={`text-xs tabular-nums w-14 ${globalLpf < 2000 ? 'text-emerald-400' : 'text-zinc-600'}`}>
            {globalLpf >= 8000 ? 'open' : `${Math.round(globalLpf)}Hz`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 whitespace-nowrap">Key</span>
          <select
            value={globalKey.root}
            onChange={e => onGlobalKeyChange({ ...globalKey, root: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {ROOT_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select
            value={globalKey.scale}
            onChange={e => onGlobalKeyChange({ ...globalKey, scale: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {SCALE_GROUPS.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.scales.map(s => <option key={s} value={s}>{s}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {webGPUAvailable && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggleLocalMode}
                title={localMode ? 'Switch to cloud AI (Claude)' : 'Switch to local AI (Qwen2.5-Coder in browser)'}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  localMode
                    ? 'border-emerald-700 bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60'
                    : 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500'
                }`}
              >
                {localMode ? '⚡ Local AI' : '☁ Cloud AI'}
              </button>
              {localMode && localModelProgress && localModelProgress.progress < 1 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.round(localModelProgress.progress * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 whitespace-nowrap">
                    {Math.round(localModelProgress.progress * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}
          {hasLanes && (
            <button
              onClick={onNew}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
            >
              New
            </button>
          )}
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500"
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                Share
              </>
            )}
          </button>
        </div>
      </div>
    </header>

  )
}
