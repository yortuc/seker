import Lane from './Lane'
import AddLanePanel from './AddLanePanel'

export default function LaneList({
  lanes,
  globalKey,
  isPlaying,
  onLog,
  generateFn,
  onAddLane,
  onAddDrumLane,
  onAddInstrumentLane,
  onAddNoteGridLane,
  onRemoveLane,
  onUpdateParam,
  onAddEffect,
  onRemoveEffect,
  onUpdateCode,
  onUpdatePromptAndCode,
  onToggleMute,
  onToggleSolo,
  onToggleDrumStep,
  onAddDrumTrack,
  onRemoveDrumTrack,
  onUpdateTabCell,
  onUpdateTabColumn,
  onUpdateTabInstrument,
  onToggleNoteGridCell,
  onSetNoteGridCell,
  onUpdateNoteGridInstrument,
}) {
  return (
    <main className="py-6 flex flex-col gap-3">
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
          isPlaying={isPlaying}
          onLog={onLog}
          generateFn={generateFn}
          onRemove={onRemoveLane}
          onUpdateParam={onUpdateParam}
          onAddEffect={onAddEffect}
          onRemoveEffect={onRemoveEffect}
          onUpdateCode={onUpdateCode}
          onUpdatePromptAndCode={onUpdatePromptAndCode}
          onToggleMute={onToggleMute}
          onToggleSolo={onToggleSolo}
          onToggleDrumStep={onToggleDrumStep}
          onAddDrumTrack={onAddDrumTrack}
          onRemoveDrumTrack={onRemoveDrumTrack}
          onUpdateTabCell={onUpdateTabCell}
          onUpdateTabColumn={onUpdateTabColumn}
          onUpdateTabInstrument={onUpdateTabInstrument}
          onToggleNoteGridCell={onToggleNoteGridCell}
          onSetNoteGridCell={onSetNoteGridCell}
          onUpdateNoteGridInstrument={onUpdateNoteGridInstrument}
        />
      ))}

      <AddLanePanel
        globalKey={globalKey}
        onLog={onLog}
        generateFn={generateFn}
        onAddLane={onAddLane}
        onAddDrumLane={onAddDrumLane}
        onAddInstrumentLane={onAddInstrumentLane}
        onAddNoteGridLane={onAddNoteGridLane}
      />
    </main>
  )
}
