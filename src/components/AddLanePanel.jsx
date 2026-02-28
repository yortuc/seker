import { useState } from 'react'
import { generatePattern } from '../utils/claude'

export default function AddLanePanel({ onAddLane }) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const inferName = (desc) => {
    const lower = desc.toLowerCase()
    if (lower.includes('drum') || lower.includes('beat') || lower.includes('kick') || lower.includes('percus')) return 'Drums'
    if (lower.includes('bass')) return 'Bass'
    if (lower.includes('chord') || lower.includes('pad')) return 'Chords'
    if (lower.includes('piano') || lower.includes('keys') || lower.includes('arpy') || lower.includes('pluck')) return 'Piano'
    if (lower.includes('melody') || lower.includes('lead') || lower.includes('synth') || lower.includes('moog') || lower.includes('supersaw')) return 'Melody'
    if (lower.includes('ambient') || lower.includes('atmosphere') || lower.includes('pad')) return 'Ambient'
    // Capitalize first word as fallback
    return desc.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const handleGenerate = async () => {
    if (!description.trim()) return

    setLoading(true)
    setError(null)
    try {
      const code = await generatePattern(description)
      const name = inferName(description)
      onAddLane(name, code, description)
      setDescription('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleGenerate()}
          placeholder="Describe a pattern... (e.g. 'funky drum pattern', 'jazzy bass line')"
          disabled={loading}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 disabled:opacity-50"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            'Generate ✨'
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  )
}
