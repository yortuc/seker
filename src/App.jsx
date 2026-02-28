import { useEffect, useRef, useState } from 'react'
import { useLanes } from './hooks/useLanes'
import { useStrudel } from './hooks/useStrudel'
import { buildEvalCode } from './utils/strudel'
import { readUrlState, writeUrlState } from './utils/urlState'
import Header from './components/Header'
import LaneList from './components/LaneList'
import SceneBar from './components/SceneBar'

export default function App() {
  const [bpm, setBpm] = useState(120)
  const [globalLpf, setGlobalLpf] = useState(8000)
  const [scenes, setScenes] = useState([])
  const hydrated = useRef(false)

  const { lanes, addLane, removeLane, updateParam, updateCode, updatePromptAndCode, toggleMute, toggleSolo, loadLanes, clearLanes, applySceneState } = useLanes()
  const { isPlaying, isInitializing, error, play, stop, debouncedPlay } = useStrudel()

  // Hydrate from URL on first render
  useEffect(() => {
    const saved = readUrlState()
    if (saved) {
      if (saved.lanes) loadLanes(saved.lanes)
      if (saved.bpm) setBpm(saved.bpm)
      if (saved.globalLpf != null) setGlobalLpf(saved.globalLpf)
      if (saved.scenes) setScenes(saved.scenes)
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
    writeUrlState({ lanes, bpm, globalLpf, scenes })
  }, [lanes, bpm, globalLpf, scenes])

  useEffect(() => {
    if (!isPlaying) return
    const code = buildEvalCode(lanes, bpm, globalLpf)
    debouncedPlay(code)
  }, [lanes, bpm, globalLpf, isPlaying])

  // Keyboard: 1-9 switch scenes
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const n = parseInt(e.key)
      if (n >= 1 && n <= 9) {
        const scene = scenes[n - 1]
        if (scene) loadScene(scene)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [scenes])

  const handlePlay = async () => {
    await play(buildEvalCode(lanes, bpm, globalLpf))
  }

  const handleNew = () => {
    stop()
    clearLanes()
    setBpm(120)
    setGlobalLpf(8000)
    setScenes([])
  }

  const handleBpmChange = (newBpm) => {
    setBpm(newBpm)
  }

  const saveScene = () => {
    const laneStates = {}
    lanes.forEach(l => {
      laneStates[l.id] = { muted: l.muted, solo: l.solo, params: { ...l.params } }
    })
    setScenes(prev => [...prev, {
      id: Date.now().toString(),
      bpm,
      globalLpf,
      laneStates
    }])
  }

  const loadScene = (scene) => {
    setBpm(scene.bpm)
    setGlobalLpf(scene.globalLpf ?? 8000)
    applySceneState(scene.laneStates)
  }

  const deleteScene = (id) => {
    setScenes(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <Header
        isPlaying={isPlaying}
        isInitializing={isInitializing}
        bpm={bpm}
        globalLpf={globalLpf}
        onPlay={handlePlay}
        onStop={stop}
        onBpmChange={handleBpmChange}
        onGlobalLpfChange={setGlobalLpf}
        onNew={handleNew}
        hasLanes={lanes.length > 0}
      />

      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
            Audio error: {error}
          </div>
        </div>
      )}

      <SceneBar
        scenes={scenes}
        hasLanes={lanes.length > 0}
        onSave={saveScene}
        onLoad={loadScene}
        onDelete={deleteScene}
      />

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
