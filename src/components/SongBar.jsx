import { useState, useRef, useEffect } from 'react'
import { relativeTime } from '../utils/songs'

export default function SongBar({ title, songs, isPlaying, onTitleChange, onSave, onLoad, onDelete }) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(title)
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef(null)
  const inputRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  // Keep local value in sync if title changes externally (e.g. song load)
  useEffect(() => { setTitleValue(title) }, [title])

  // Resize canvas to match container
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const updateSize = () => {
      const w = container.offsetWidth
      const h = container.offsetHeight
      if (w > 0 && h > 0) {
        const dpr = window.devicePixelRatio || 1
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Close panel on outside click
  useEffect(() => {
    if (!panelOpen) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelOpen])

  const commitTitle = () => {
    const trimmed = titleValue.trim()
    if (trimmed) onTitleChange(trimmed)
    else setTitleValue(title)
    setEditingTitle(false)
  }

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-3 relative">
      {/* Background visualizer canvas */}
      <canvas
        ref={canvasRef}
        id="strudel-viz-canvas"
        className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500 ${isPlaying ? 'opacity-40' : 'opacity-0'}`}
        style={{ display: 'block' }}
      />
      {/* Editable song title */}
      {editingTitle ? (
        <input
          ref={inputRef}
          value={titleValue}
          onChange={e => setTitleValue(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={e => {
            if (e.key === 'Enter') commitTitle()
            if (e.key === 'Escape') { setTitleValue(title); setEditingTitle(false) }
          }}
          className="absolute left-1/2 -translate-x-1/2 w-64 bg-transparent border-b border-violet-500 text-zinc-100 light:text-zinc-900 text-lg font-semibold font-mono focus:outline-none pb-0.5 text-center"
          autoFocus
        />
      ) : (
        <button
          onClick={() => setEditingTitle(true)}
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 group"
          title="Click to rename"
        >
          <span className="text-lg font-semibold font-mono text-zinc-100 light:text-zinc-900 group-hover:text-white light:group-hover:text-zinc-700 transition-colors">
            {title}
          </span>
          <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors text-xs">✎</span>
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Save */}
        <button
          onClick={() => { onSave(); setPanelOpen(false) }}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 light:border-zinc-300 text-zinc-400 light:text-zinc-600 hover:text-zinc-100 light:hover:text-zinc-900 hover:border-zinc-500 light:hover:border-zinc-400 transition-colors"
        >
          Save
        </button>

        {/* Songs panel toggle */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setPanelOpen(v => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              panelOpen
                ? 'border-violet-600 bg-violet-900/30 light:bg-violet-100/30 text-violet-300 light:text-violet-600'
                : 'border-zinc-700 light:border-zinc-300 text-zinc-400 light:text-zinc-600 hover:text-zinc-100 light:hover:text-zinc-900 hover:border-zinc-500 light:hover:border-zinc-400'
            }`}
          >
            Songs {songs.length > 0 && <span className="ml-1 text-zinc-500">{songs.length}</span>}
          </button>

          {panelOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-zinc-900 light:bg-white border border-zinc-700 light:border-zinc-200 rounded-xl shadow-2xl z-20 overflow-hidden">
              {songs.length === 0 ? (
                <p className="px-4 py-6 text-xs text-zinc-600 light:text-zinc-500 text-center">No saved songs yet.</p>
              ) : (
                <ul className="max-h-80 overflow-y-auto">
                  {songs.map(song => (
                    <li
                      key={song.id}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-zinc-800 light:hover:bg-zinc-50 group/song cursor-pointer border-b border-zinc-800 light:border-zinc-100 last:border-0"
                      onClick={() => { onLoad(song); setPanelOpen(false) }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 light:text-zinc-800 font-mono truncate">{song.name}</p>
                        <p className="text-xs text-zinc-600 light:text-zinc-500">{relativeTime(song.savedAt)}</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); onDelete(song.id) }}
                        className="opacity-0 group-hover/song:opacity-100 text-zinc-600 light:text-zinc-400 hover:text-red-400 transition-all text-sm flex-shrink-0 px-1"
                        title="Delete"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
