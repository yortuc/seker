import Lane from './Lane'
import AddLanePanel from './AddLanePanel'

export default function LaneList({
  lanes,
  onAddLane,
  onRemoveLane,
  onUpdateParam,
  onUpdateCode,
  onUpdatePromptAndCode,
  onToggleMute,
  onToggleSolo,
}) {
  return (
    <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-3">
      {lanes.length === 0 && (
        <div className="text-center py-16 text-zinc-600">
          <p className="text-4xl mb-3">♩</p>
          <p className="text-sm">No lanes yet. Describe a pattern below to get started.</p>
          <p className="text-xs mt-1 text-zinc-700">Click Play to initialize audio after adding lanes.</p>
        </div>
      )}

      {lanes.map(lane => (
        <Lane
          key={lane.id}
          lane={lane}
          onRemove={onRemoveLane}
          onUpdateParam={onUpdateParam}
          onUpdateCode={onUpdateCode}
          onUpdatePromptAndCode={onUpdatePromptAndCode}
          onToggleMute={onToggleMute}
          onToggleSolo={onToggleSolo}
        />
      ))}

      <AddLanePanel onAddLane={onAddLane} />
    </main>
  )
}
