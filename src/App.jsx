import { useEffect, useRef, useState } from 'react'
import { useLanes } from './hooks/useLanes'
import { useStrudel } from './hooks/useStrudel'
import { buildEvalCode } from './utils/strudel'
import { readUrlState, writeUrlState } from './utils/urlState'
import Header from './components/Header'
import LaneList from './components/LaneList'

export default function App() {
  const [bpm, setBpm] = useState(120)
  const hydrated = useRef(false)

  const { lanes, addLane, removeLane, updateParam, updateCode, updatePromptAndCode, toggleMute, toggleSolo, loadLanes } = useLanes()
  const { isPlaying, isInitializing, error, play, stop, updateBpm, debouncedPlay } = useStrudel()

  // Hydrate from URL on first render
  useEffect(() => {
    const saved = readUrlState()
    if (saved) {
      if (saved.lanes) loadLanes(saved.lanes)
      if (saved.bpm) setBpm(saved.bpm)
    }
    hydrated.current = true
  }, [])

  // Write URL whenever state changes (skip until hydrated to avoid overwriting URL)
  useEffect(() => {
    if (!hydrated.current) return
    if (lanes.length === 0) {
      window.history.replaceState(null, '', window.location.pathname)
      return
    }
    writeUrlState({ lanes, bpm })
  }, [lanes, bpm])

  useEffect(() => {
    if (!isPlaying) return
    const code = buildEvalCode(lanes, bpm)
    debouncedPlay(code)
  }, [lanes, bpm, isPlaying])

  const handlePlay = async () => {
    const code = buildEvalCode(lanes, bpm)
    await updateBpm(bpm)
    await play(code)
  }

  const handleBpmChange = (newBpm) => {
    setBpm(newBpm)
    if (isPlaying) updateBpm(newBpm)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <Header
        isPlaying={isPlaying}
        isInitializing={isInitializing}
        bpm={bpm}
        onPlay={handlePlay}
        onStop={stop}
        onBpmChange={handleBpmChange}
      />

      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
            Audio error: {error}
          </div>
        </div>
      )}

      <LaneList
        lanes={lanes}
        onAddLane={addLane}
        onRemoveLane={removeLane}
        onUpdateParam={updateParam}
        onUpdateCode={updateCode}
        onUpdatePromptAndCode={updatePromptAndCode}
        onToggleMute={toggleMute}
        onToggleSolo={toggleSolo}
      />
    </div>
  )
}
