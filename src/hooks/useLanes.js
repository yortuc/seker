import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { drumPatternToStrudel, DEFAULT_DRUM_PATTERN } from '../utils/drumPattern'

const DEFAULT_PARAMS = { gain: 0.8, lpf: 4000, room: 0.2, delay: 0.0 }

const EMOJI_MAP = {
  drum: '🥁', bass: '🎸', chord: '🎹', melody: '🎵',
  lead: '🎺', pad: '🎷', ambient: '🌊', default: '🎵'
}

function inferEmoji(name) {
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key)) return emoji
  }
  return EMOJI_MAP.default
}

export function useLanes() {
  const [lanes, setLanes] = useState([])

  const addLane = (name, baseCode, prompt = '', analysis = null) => {
    const newLane = {
      id: uuidv4(),
      type: 'strudel',
      name,
      emoji: inferEmoji(name),
      prompt,
      analysis,
      baseCode,
      params: { ...DEFAULT_PARAMS },
      muted: false,
      solo: false,
      orbit: lanes.length
    }
    setLanes(prev => [...prev, newLane])
    return newLane
  }

  const addDrumLane = () => {
    const pattern = {
      steps: DEFAULT_DRUM_PATTERN.steps,
      tracks: DEFAULT_DRUM_PATTERN.tracks.map(t => ({
        sound: t.sound,
        steps: [...t.steps]   // deep copy — each lane must own its arrays
      }))
    }
    const newLane = {
      id: uuidv4(),
      type: 'drum',
      name: 'Drums',
      emoji: '🥁',
      pattern,
      baseCode: drumPatternToStrudel(pattern),
      params: { ...DEFAULT_PARAMS },
      muted: false,
      solo: false,
      orbit: lanes.length
    }
    setLanes(prev => [...prev, newLane])
    return newLane
  }

  const removeLane = (id) => setLanes(prev => prev.filter(l => l.id !== id))

  const updateParam = (id, paramKey, value) => {
    setLanes(prev => prev.map(l =>
      l.id === id ? { ...l, params: { ...l.params, [paramKey]: value } } : l
    ))
  }

  const updateCode = (id, baseCode) => {
    setLanes(prev => prev.map(l => l.id === id ? { ...l, baseCode } : l))
  }

  const updatePromptAndCode = (id, prompt, baseCode, analysis = null) => {
    setLanes(prev => prev.map(l => l.id === id ? { ...l, prompt, baseCode, analysis } : l))
  }

  const toggleMute = (id) => {
    setLanes(prev => prev.map(l => l.id === id ? { ...l, muted: !l.muted } : l))
  }

  const toggleSolo = (id) => {
    setLanes(prev => prev.map(l => l.id === id ? { ...l, solo: !l.solo } : l))
  }

  const toggleDrumStep = (id, trackIndex, stepIndex) => {
    setLanes(prev => prev.map(l => {
      if (l.id !== id) return l
      const newTracks = l.pattern.tracks.map((t, ti) =>
        ti === trackIndex
          ? { ...t, steps: t.steps.map((s, si) => si === stepIndex ? (s ? 0 : 1) : s) }
          : t
      )
      const newPattern = { ...l.pattern, tracks: newTracks }
      return { ...l, pattern: newPattern, baseCode: drumPatternToStrudel(newPattern) }
    }))
  }

  const addDrumTrack = (id, sound) => {
    setLanes(prev => prev.map(l => {
      if (l.id !== id) return l
      const newTrack = { sound, steps: Array(l.pattern.steps).fill(0) }
      const newPattern = { ...l.pattern, tracks: [...l.pattern.tracks, newTrack] }
      return { ...l, pattern: newPattern, baseCode: drumPatternToStrudel(newPattern) }
    }))
  }

  const removeDrumTrack = (id, trackIndex) => {
    setLanes(prev => prev.map(l => {
      if (l.id !== id || l.pattern.tracks.length <= 1) return l
      const newTracks = l.pattern.tracks.filter((_, ti) => ti !== trackIndex)
      const newPattern = { ...l.pattern, tracks: newTracks }
      return { ...l, pattern: newPattern, baseCode: drumPatternToStrudel(newPattern) }
    }))
  }

  const loadLanes = (newLanes) => setLanes(newLanes)
  const clearLanes = () => setLanes([])

  const applySceneState = (laneStates) => {
    setLanes(prev => prev.map(l => {
      const s = laneStates[l.id]
      if (!s) return l
      return { ...l, muted: s.muted, solo: s.solo, params: { ...l.params, ...s.params } }
    }))
  }

  return {
    lanes,
    addLane, addDrumLane, removeLane,
    updateParam, updateCode, updatePromptAndCode,
    toggleMute, toggleSolo,
    toggleDrumStep, addDrumTrack, removeDrumTrack,
    loadLanes, clearLanes, applySceneState
  }
}
