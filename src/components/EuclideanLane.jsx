import { ALL_DRUM_SOUNDS } from '../utils/drumPattern'
import { euclidean, rotate } from '../utils/euclidean'

export default function EuclideanLane({ lane, currentStep, onUpdatePattern }) {
  const { pattern } = lane
  const { sound, hits, steps, rotation } = pattern

  const rawPattern = euclidean(hits, steps)
  const displayPattern = rotate(rawPattern, rotation)

  const update = (field, value) => onUpdatePattern(lane.id, { ...pattern, [field]: value })

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-2">
      {/* Step strip */}
      <div className="flex gap-0.5">
        {displayPattern.map((active, i) => {
          const isCurrentStep = i === currentStep
          return (
            <div
              key={i}
              className={`flex-1 h-5 rounded-sm transition-colors flex-shrink-0 ${
                i > 0 && i % 4 === 0 ? 'ml-1' : ''
              } ${
                active
                  ? isCurrentStep ? 'bg-white' : 'bg-violet-500'
                  : isCurrentStep ? 'bg-zinc-600' : 'bg-zinc-800'
              }`}
            />
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Sound picker */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 font-mono w-10">sound</span>
          <select
            value={ALL_DRUM_SOUNDS.includes(sound) ? sound : '__custom__'}
            onChange={e => {
              if (e.target.value !== '__custom__') update('sound', e.target.value)
            }}
            className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-violet-500"
          >
            {ALL_DRUM_SOUNDS.map(s => <option key={s} value={s}>{s}</option>)}
            {!ALL_DRUM_SOUNDS.includes(sound) && (
              <option value="__custom__">{sound}</option>
            )}
          </select>
          <input
            value={sound}
            onChange={e => update('sound', e.target.value)}
            className="w-16 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-violet-500"
            placeholder="custom"
          />
        </div>

        {/* Hits */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 font-mono w-6">hits</span>
          <input
            type="range" min={1} max={steps} step={1} value={hits}
            onChange={e => update('hits', Number(e.target.value))}
            className="w-20 h-1.5 appearance-none bg-zinc-700 rounded-full cursor-pointer accent-violet-500"
          />
          <span className="text-xs text-violet-400 tabular-nums w-4">{hits}</span>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 font-mono w-8">steps</span>
          <input
            type="range" min={4} max={32} step={1} value={steps}
            onChange={e => {
              const newSteps = Number(e.target.value)
              update('steps', newSteps)
              // clamp hits if needed
              if (hits > newSteps) update('hits', newSteps)
            }}
            className="w-20 h-1.5 appearance-none bg-zinc-700 rounded-full cursor-pointer accent-violet-500"
          />
          <span className="text-xs text-violet-400 tabular-nums w-4">{steps}</span>
        </div>

        {/* Rotation */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 font-mono w-10">rotate</span>
          <input
            type="range" min={0} max={steps - 1} step={1} value={rotation}
            onChange={e => update('rotation', Number(e.target.value))}
            className="w-20 h-1.5 appearance-none bg-zinc-700 rounded-full cursor-pointer accent-violet-500"
          />
          <span className="text-xs text-violet-400 tabular-nums w-4">{rotation}</span>
        </div>
      </div>
    </div>
  )
}
