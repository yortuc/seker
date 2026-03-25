import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { drumPatternToStrudel, DEFAULT_DRUM_PATTERN, DRUM_KITS } from '../utils/drumPattern'
import { tabPatternToStrudel, DEFAULT_TAB_PATTERN, defaultChordForRoot } from '../utils/guitarTab'
import { noteGridToStrudel, DEFAULT_NOTE_GRID, makeEmptyGrid } from '../utils/noteGrid'
import { DEFAULT_EFFECTS, EFFECT_DEFS, migrateParams } from '../utils/effects'

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
      params: DEFAULT_EFFECTS.map(e => ({ ...e })),
      muted: false,
      solo: false,
      orbit: lanes.length
    }
    setLanes(prev => [...prev, newLane])
    return newLane
  }

  const applyDrumKit = (id, kitId) => {
    const kit = DRUM_KITS.find(k => k.id === kitId)
    if (!kit) return
    setLanes(prev => prev.map(l => {
      if (l.id !== id) return l
      const newTracks = l.pattern.tracks.map(t => {
        const baseName = t.sound.split(':')[0]
        const newSound = kit.sounds[baseName] ?? t.sound
        return { ...t, sound: newSound }
      })
      const newPattern = { ...l.pattern, tracks: newTracks, kitId }
      return { ...l, pattern: newPattern, baseCode: drumPatternToStrudel(newPattern) }
    }))
  }

  const addDrumLane = () => {
    const pattern = {
      steps: DEFAULT_DRUM_PATTERN.steps,
      kitId: DEFAULT_DRUM_PATTERN.kitId,
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
      params: DEFAULT_EFFECTS.map(e => ({ ...e })),
      muted: false,
      solo: false,
      orbit: lanes.length
    }
    setLanes(prev => [...prev, newLane])
    return newLane
  }

  const removeLane = (id) => setLanes(prev => prev.filter(l => l.id !== id))

  const updateParam = (id, effectType, value) => {
    setLanes(prev => prev.map(l =>
      l.id !== id ? l : {
        ...l,
        params: migrateParams(l.params).map(p => p.type === effectType ? { ...p, value } : p)
      }
    ))
  }

  const addEffect = (id, effectType) => {
    const def = EFFECT_DEFS[effectType]
    if (!def) return
    setLanes(prev => prev.map(l => {
      if (l.id !== id) return l
      const params = migrateParams(l.params)
      if (params.some(p => p.type === effectType)) return l
      return { ...l, params: [...params, { type: effectType, value: def.default }] }
    }))
  }

  const removeEffect = (id, effectType) => {
    setLanes(prev => prev.map(l =>
      l.id !== id ? l : { ...l, params: migrateParams(l.params).filter(p => p.type !== effectType) }
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

  const addNoteGridLane = () => {
    const { steps, lowOctave, highOctave, instrument } = DEFAULT_NOTE_GRID
    const grid = makeEmptyGrid(lowOctave, highOctave, steps)
    const pattern = { steps, lowOctave, highOctave, instrument, grid }
    const newLane = {
      id: uuidv4(),
      type: 'notegrid',
      name: 'Melody',
      emoji: '🎹',
      pattern,
      baseCode: noteGridToStrudel(pattern),
      params: DEFAULT_EFFECTS.map(e => ({ ...e })),
      muted: false,
      solo: false,
      orbit: lanes.length
    }
    setLanes(prev => [...prev, newLane])
    return newLane
  }

  const addInstrumentLane = (globalKey) => {
    const firstCol = globalKey?.root
      ? defaultChordForRoot(globalKey.root)
      : [...DEFAULT_TAB_PATTERN.tab[0]]
    const pattern = {
      ...DEFAULT_TAB_PATTERN,
      tab: DEFAULT_TAB_PATTERN.tab.map((col, i) => i === 0 ? firstCol : [...col])
    }
    const newLane = {
      id: uuidv4(),
      type: 'instrument',
      name: 'Guitar',
      emoji: '🎸',
      pattern,
      baseCode: tabPatternToStrudel(pattern),
      params: DEFAULT_EFFECTS.map(e => ({ ...e })),
      muted: false,
      solo: false,
      orbit: lanes.length
    }
    setLanes(prev => [...prev, newLane])
    return newLane
  }

  const updateTabCell = (id, stepIndex, stringIndex, fret) => {
    setLanes(prev => prev.map(l => {
      if (l.id !== id) return l
      const newTab = l.pattern.tab.map((col, si) =>
        si === stepIndex
          ? col.map((f, ri) => ri === stringIndex ? fret : f)
          : col
      )
      const newPattern = { ...l.pattern, tab: newTab }
      return { ...l, pattern: newPattern, baseCode: tabPatternToStrudel(newPattern) }
    }))
  }

  const updateTabColumn = (id, stepIndex, frets) => {
    setLanes(prev => prev.map(l => {
      if (l.id !== id) return l
      const newTab = l.pattern.tab.map((col, si) => si === stepIndex ? [...frets] : col)
      const newPattern = { ...l.pattern, tab: newTab }
      return { ...l, pattern: newPattern, baseCode: tabPatternToStrudel(newPattern) }
    }))
  }

  const setNoteGridCell = (id, noteIndex, stepIndex, value) => {
    setLanes(prev => prev.map(l => {
      if (l.id !== id) return l
      const newGrid = l.pattern.grid.map((row, ni) =>
        ni === noteIndex
          ? row.map((v, si) => si === stepIndex ? value : v)
          : row
      )
      const newPattern = { ...l.pattern, grid: newGrid }
      return { ...l, pattern: newPattern, baseCode: noteGridToStrudel(newPattern) }
    }))
  }

  const toggleNoteGridCell = (id, noteIndex, stepIndex) => {
    setLanes(prev => prev.map(l => {
      if (l.id !== id) return l
      const cell = l.pattern.grid[noteIndex]?.[stepIndex] ?? 0
      const newGrid = l.pattern.grid.map((row, ni) =>
        ni === noteIndex
          ? row.map((v, si) => si === stepIndex ? (cell ? 0 : 1) : v)
          : row
      )
      const newPattern = { ...l.pattern, grid: newGrid }
      return { ...l, pattern: newPattern, baseCode: noteGridToStrudel(newPattern) }
    }))
  }

  const updateNoteGridInstrument = (id, instrument) => {
    setLanes(prev => prev.map(l => {
      if (l.id !== id) return l
      const newPattern = { ...l.pattern, instrument }
      return { ...l, pattern: newPattern, baseCode: noteGridToStrudel(newPattern) }
    }))
  }

  const updateTabInstrument = (id, instrument) => {
    setLanes(prev => prev.map(l => {
      if (l.id !== id) return l
      const newPattern = { ...l.pattern, instrument }
      return { ...l, pattern: newPattern, baseCode: tabPatternToStrudel(newPattern) }
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
      return { ...l, muted: s.muted, solo: s.solo, params: migrateParams(s.params) }
    }))
  }

  return {
    lanes,
    addLane, addDrumLane, addInstrumentLane, addNoteGridLane, removeLane,
    updateParam, addEffect, removeEffect, updateCode, updatePromptAndCode,
    toggleMute, toggleSolo,
    toggleDrumStep, addDrumTrack, removeDrumTrack, applyDrumKit,
    updateTabCell, updateTabColumn, updateTabInstrument,
    toggleNoteGridCell, setNoteGridCell, updateNoteGridInstrument,
    loadLanes, clearLanes, applySceneState
  }
}
