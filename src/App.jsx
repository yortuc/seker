import { useEffect, useRef, useState } from 'react'
import { useLanes } from './hooks/useLanes'
import { useStrudel } from './hooks/useStrudel'
import { buildEvalCode } from './utils/strudel'
import { readUrlState, writeUrlState } from './utils/urlState'
import { generatePattern } from './utils/claude'
import { generatePatternLocal, isWebGPUAvailable, unloadEngine } from './utils/webllm.js'
import Header from './components/Header'
import LaneList from './components/LaneList'
import SceneBar from './components/SceneBar'
import GenLog from './components/GenLog'
import SongBar from './components/SongBar'
import { generateSongName, loadSongs, saveSong, deleteSong } from './utils/songs'

export default function App() {
  const [bpm, setBpm] = useState(120)
  const [globalLpf, setGlobalLpf] = useState(8000)
  const [globalKey, setGlobalKey] = useState({ root: 'C', scale: 'minor' })
  const [scenes, setScenes] = useState([])
  const [genLog, setGenLog] = useState([])
  const [localMode, setLocalMode] = useState(false)
  const [songTitle, setSongTitle] = useState(generateSongName)
  const [songs, setSongs] = useState(loadSongs)
  const [localModelProgress, setLocalModelProgress] = useState(null) // { text, progress }
  const [isLight, setIsLight] = useState(false)

  const generateFn = localMode
    ? (desc, onStep, key, onLog) => generatePatternLocal(desc, onStep, key, (text, progress) => setLocalModelProgress({ text, progress }))
    : generatePattern

  const handleToggleLocalMode = () => {
    if (localMode) {
      unloadEngine()
      setLocalModelProgress(null)
    }
    setLocalMode(v => !v)
  }

  const handleLog = (type, sessionId, data) => {
    setGenLog(prev => {
      if (type === 'start') {
        return [{ id: sessionId, prompt: data, status: 'analyzing', analysis: null, code: null, error: null }, ...prev].slice(0, 20)
      }
      return prev.map(s => {
        if (s.id !== sessionId) return s
        if (type === 'analysis') return { ...s, analysis: data, status: 'generating' }
        if (type === 'code')     return { ...s, code: data, status: 'done' }
        if (type === 'error')    return { ...s, error: data, status: 'error' }
        return s
      })
    })
  }
  const hydrated = useRef(false)

  const {
    lanes,
    addLane, addDrumLane, addInstrumentLane, addNoteGridLane, removeLane,
    updateParam, addEffect, removeEffect, updateCode, updatePromptAndCode,
    toggleMute, toggleSolo,
    toggleDrumStep, addDrumTrack, removeDrumTrack,
    updateTabCell, updateTabColumn, updateTabInstrument,
    toggleNoteGridCell, setNoteGridCell, updateNoteGridInstrument,
    loadLanes, clearLanes, applySceneState
  } = useLanes()
  const { isPlaying, isInitializing, error, play, stop, debouncedPlay } = useStrudel()

  // Hydrate from URL on first render
  useEffect(() => {
    const saved = readUrlState()
    if (saved) {
      if (saved.lanes) loadLanes(saved.lanes)
      if (saved.bpm) setBpm(saved.bpm)
      if (saved.globalLpf != null) setGlobalLpf(saved.globalLpf)
      if (saved.globalKey) setGlobalKey(saved.globalKey)
      if (saved.scenes) setScenes(saved.scenes)
      if (saved.title) setSongTitle(saved.title)
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
    writeUrlState({ lanes, bpm, globalLpf, globalKey, scenes, title: songTitle })
  }, [lanes, bpm, globalLpf, scenes, songTitle])

  useEffect(() => {
    if (!isPlaying) return
    const code = buildEvalCode(lanes, bpm, globalLpf, 'scope')
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
    await play(buildEvalCode(lanes, bpm, globalLpf, 'scope'))
  }

  const handleNew = () => {
    stop()
    clearLanes()
    setBpm(120)
    setGlobalLpf(8000)
    setGlobalKey({ root: 'C', scale: 'minor' })
    setScenes([])
    setSongTitle(generateSongName())
  }

  const handleSaveSong = () => {
    const state = { lanes, bpm, globalLpf, globalKey, scenes, title: songTitle }
    setSongs(saveSong(songTitle, state))
  }

  const handleLoadSong = (song) => {
    stop()
    const { state } = song
    if (state.lanes) loadLanes(state.lanes)
    if (state.bpm) setBpm(state.bpm)
    if (state.globalLpf != null) setGlobalLpf(state.globalLpf)
    if (state.globalKey) setGlobalKey(state.globalKey)
    if (state.scenes) setScenes(state.scenes)
    setSongTitle(song.name)
  }

  const handleDeleteSong = (id) => {
    setSongs(deleteSong(id))
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
    <div className={`min-h-screen bg-zinc-950 light:bg-zinc-50 text-zinc-100 light:text-zinc-900 font-mono${isLight ? ' light' : ''}`}>
      <Header
        isPlaying={isPlaying}
        isInitializing={isInitializing}
        bpm={bpm}
        globalLpf={globalLpf}
        globalKey={globalKey}
        onPlay={handlePlay}
        onStop={stop}
        onBpmChange={handleBpmChange}
        onGlobalLpfChange={setGlobalLpf}
        onGlobalKeyChange={setGlobalKey}
        onNew={handleNew}
        hasLanes={lanes.length > 0}
        localMode={localMode}
        localModelProgress={localModelProgress}
        webGPUAvailable={isWebGPUAvailable()}
        onToggleLocalMode={handleToggleLocalMode}
        isLight={isLight}
        onToggleTheme={() => setIsLight(v => !v)}
      />

      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
            Audio error: {error}
          </div>
        </div>
      )}

      <SongBar
        title={songTitle}
        songs={songs}
        isPlaying={isPlaying}
        onTitleChange={setSongTitle}
        onSave={handleSaveSong}
        onLoad={handleLoadSong}
        onDelete={handleDeleteSong}
      />

      <SceneBar
        scenes={scenes}
        hasLanes={lanes.length > 0}
        onSave={saveScene}
        onLoad={loadScene}
        onDelete={deleteScene}
      />

      <div className="max-w-5xl mx-auto px-4 flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          <LaneList
            lanes={lanes}
            globalKey={globalKey}
            isPlaying={isPlaying}
        generateFn={generateFn}
        onAddLane={addLane}
        onAddDrumLane={addDrumLane}
        onAddInstrumentLane={addInstrumentLane}
        onAddNoteGridLane={addNoteGridLane}
        onRemoveLane={removeLane}
        onUpdateParam={updateParam}
        onAddEffect={addEffect}
        onRemoveEffect={removeEffect}
        onUpdateCode={updateCode}
        onUpdatePromptAndCode={updatePromptAndCode}
        onToggleMute={toggleMute}
        onToggleSolo={toggleSolo}
        onToggleDrumStep={toggleDrumStep}
        onAddDrumTrack={addDrumTrack}
        onRemoveDrumTrack={removeDrumTrack}
        onUpdateTabCell={updateTabCell}
        onUpdateTabColumn={updateTabColumn}
        onUpdateTabInstrument={updateTabInstrument}
        onToggleNoteGridCell={toggleNoteGridCell}
        onSetNoteGridCell={setNoteGridCell}
        onUpdateNoteGridInstrument={updateNoteGridInstrument}
        onLog={handleLog}
          />
        </div>
        <GenLog sessions={genLog} />
      </div>
    </div>
  )
}
