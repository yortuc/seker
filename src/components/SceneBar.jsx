export default function SceneBar({ scenes, hasLanes, onSave, onLoad, onDelete }) {
  if (!hasLanes && scenes.length === 0) return null

  return (
    <div className="border-b border-zinc-800/60 bg-zinc-950/60">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc-700 whitespace-nowrap font-mono">scenes</span>

        {scenes.map((scene, i) => (
          <div key={scene.id} className="relative group">
            <button
              onClick={() => onLoad(scene)}
              title={`Switch to scene ${i + 1} (press ${i + 1})`}
              className="px-3 py-1 rounded-lg text-xs font-mono border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-violet-500 hover:bg-violet-500/10 transition-colors"
            >
              {i + 1}
            </button>
            <button
              onClick={() => onDelete(scene.id)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-500 hover:text-red-400 hover:border-red-800 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Delete scene"
            >
              ×
            </button>
          </div>
        ))}

        {hasLanes && (
          <button
            onClick={onSave}
            title="Save current mix as a new scene"
            className="px-3 py-1 rounded-lg text-xs font-mono border border-dashed border-zinc-700 text-zinc-600 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
          >
            + save
          </button>
        )}

        {scenes.length > 0 && (
          <span className="text-xs text-zinc-700 ml-1">· press 1–{Math.min(scenes.length, 9)} to switch</span>
        )}
      </div>
    </div>
  )
}
