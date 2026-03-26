import { useState } from 'react'

export default function AddLanePanel({ globalKey, onLog, generateFn, onAddLane, onAddDrumLane, onAddInstrumentLane, onAddNoteGridLane }) {
  const [activeTab, setActiveTab] = useState('strudel')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [error, setError] = useState(null)

  const inferName = (desc) => {
    const lower = desc.toLowerCase()
    if (lower.includes('drum') || lower.includes('beat') || lower.includes('kick') || lower.includes('percus')) return 'Drums'
    if (lower.includes('bass')) return 'Bass'
    if (lower.includes('chord') || lower.includes('pad')) return 'Chords'
    if (lower.includes('piano') || lower.includes('keys') || lower.includes('arpy') || lower.includes('pluck')) return 'Piano'
    if (lower.includes('melody') || lower.includes('lead') || lower.includes('synth') || lower.includes('moog') || lower.includes('supersaw')) return 'Melody'
    if (lower.includes('ambient') || lower.includes('atmosphere')) return 'Ambient'
    return desc.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const handleGenerate = async () => {
    if (!description.trim()) return
    setLoading(true)
    setStep('')
    setError(null)
    try {
      const { code, analysis } = await generateFn(description, setStep, globalKey, onLog)
      const name = inferName(description)
      onAddLane(name, code, description, analysis)
      setDescription('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setStep('')
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-4">
      {/* Track type tabs */}
      <div className="flex gap-1.5 mb-3">
        <button
          onClick={() => setActiveTab('strudel')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
            activeTab === 'strudel'
              ? 'bg-violet-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
          }`}
        >
          Strudel ✨
        </button>
        <button
          onClick={() => setActiveTab('drum')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
            activeTab === 'drum'
              ? 'bg-violet-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
          }`}
        >
          Drums 🥁
        </button>
        <button
          onClick={() => setActiveTab('instrument')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
            activeTab === 'instrument'
              ? 'bg-violet-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
          }`}
        >
          Instrument 🎸
        </button>
        <button
          onClick={() => setActiveTab('notegrid')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
            activeTab === 'notegrid'
              ? 'bg-violet-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
          }`}
        >
          Note Grid 🎹
        </button>
      </div>

      {/* Strudel panel */}
      {activeTab === 'strudel' && (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && handleGenerate()}
              placeholder="Describe a pattern… (e.g. 'funky drum pattern', 'muse - muscle museum bass')"
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
                  {step || 'Working…'}
                </>
              ) : 'Generate ✨'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </>
      )}

      {/* Drum panel */}
      {activeTab === 'drum' && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            16-step sequencer · bd sd hh ho cp rows · click steps to toggle
          </p>
          <button
            onClick={onAddDrumLane}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
          >
            Add drum track
          </button>
        </div>
      )}

      {/* Instrument panel */}
      {activeTab === 'instrument' && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Guitar tab · 6 strings · standard tuning · type frets or chord shorthand (e.g. 022100)
          </p>
          <button
            onClick={() => onAddInstrumentLane(globalKey)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
          >
            Add instrument track
          </button>
        </div>
      )}

      {/* Note grid panel */}
      {activeTab === 'notegrid' && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Piano roll · 2 octaves (C3–B4) · 16 steps · click cells to draw notes
          </p>
          <button
            onClick={onAddNoteGridLane}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
          >
            Add note grid
          </button>
        </div>
      )}
    </div>
  )
}
