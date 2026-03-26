import { useState } from 'react'
import { ALL_DRUM_SOUNDS } from '../utils/drumPattern'

export default function DrumLane({ lane, currentStep, onToggleStep, onAddTrack, onRemoveTrack }) {
  const [showSoundPicker, setShowSoundPicker] = useState(false)
  const { pattern } = lane

  const usedSounds = pattern.tracks.map(t => t.sound)
  const availableSounds = ALL_DRUM_SOUNDS.filter(s => !usedSounds.includes(s))

  return (
    <div className="flex-1 min-w-0">
      <div className="flex flex-col gap-1">
        {pattern.tracks.map((track, trackIndex) => (
          <div key={track.sound} className="flex items-center gap-2 group/track">
            {/* Sound label */}
            <span className="text-xs text-zinc-500 light:text-zinc-600 font-mono w-7 text-right flex-shrink-0 select-none">
              {track.sound}
            </span>

            {/* Steps — grouped visually in sets of 4 */}
            <div className="flex gap-0.5">
              {track.steps.map((active, stepIndex) => {
                const isCurrentStep = stepIndex === currentStep
                return (
                  <button
                    key={stepIndex}
                    onClick={() => onToggleStep(lane.id, trackIndex, stepIndex)}
                    className={`w-6 h-5 rounded-sm transition-colors flex-shrink-0 ${
                      stepIndex > 0 && stepIndex % 4 === 0 ? 'ml-1' : ''
                    } ${
                      active
                        ? isCurrentStep
                          ? 'bg-white'
                          : 'bg-violet-500 hover:bg-violet-400'
                        : isCurrentStep
                        ? 'bg-zinc-600 light:bg-zinc-400'
                        : 'bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 light:hover:bg-zinc-300'
                    }`}
                  />
                )
              })}
            </div>

            {/* Remove row button — hover only, guarded to >1 track */}
            {pattern.tracks.length > 1 && (
              <button
                onClick={() => onRemoveTrack(lane.id, trackIndex)}
                className="text-xs text-zinc-700 hover:text-red-400 opacity-0 group-hover/track:opacity-100 transition-opacity flex-shrink-0"
                title={`Remove ${track.sound}`}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Add sound row */}
        {availableSounds.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5 ml-9">
            {showSoundPicker ? (
              <>
                {availableSounds.map(sound => (
                  <button
                    key={sound}
                    onClick={() => { onAddTrack(lane.id, sound); setShowSoundPicker(false) }}
                    className="px-2 py-0.5 text-xs font-mono bg-zinc-800 light:bg-zinc-100 hover:bg-zinc-700 light:hover:bg-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-zinc-100 light:hover:text-zinc-900 rounded transition-colors"
                  >
                    {sound}
                  </button>
                ))}
                <button
                  onClick={() => setShowSoundPicker(false)}
                  className="text-xs text-zinc-600 hover:text-zinc-400 px-1 ml-1"
                >
                  ✕
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowSoundPicker(true)}
                className="text-xs text-zinc-700 light:text-zinc-500 hover:text-zinc-400 transition-colors font-mono"
              >
                + add sound
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
