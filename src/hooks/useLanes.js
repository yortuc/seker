import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

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

  const loadLanes = (newLanes) => setLanes(newLanes)
  const clearLanes = () => setLanes([])

  return { lanes, addLane, removeLane, updateParam, updateCode, updatePromptAndCode, toggleMute, toggleSolo, loadLanes, clearLanes }
}
