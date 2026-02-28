export default function ParamSlider({ label, value, min, max, step = 0.01, format, onChange }) {
  const display = format ? format(value) : value.toFixed(2)

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex justify-between items-center">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
        <span className="text-xs text-violet-400 tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none bg-zinc-700 rounded-full cursor-pointer accent-violet-500"
      />
    </div>
  )
}
