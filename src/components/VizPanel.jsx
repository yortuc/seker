import { useEffect, useRef } from 'react'

const VIZ_TYPES = ['scope', 'spectrum']

export default function VizPanel({ vizType, onVizTypeChange }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const updateSize = () => {
      const w = container.offsetWidth
      const h = container.offsetHeight
      if (w > 0 && h > 0) {
        const dpr = window.devicePixelRatio || 1
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
    }

    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="flex items-center gap-2 py-1.5">
        <span className="text-xs text-zinc-600">viz</span>
        {VIZ_TYPES.map(type => (
          <button
            key={type}
            onClick={() => onVizTypeChange(vizType === type ? null : type)}
            className={`px-2 py-0.5 rounded text-xs font-mono transition-colors border ${
              vizType === type
                ? 'bg-violet-900/40 border-violet-700 text-violet-300'
                : 'bg-transparent border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      <div
        ref={containerRef}
        className={`overflow-hidden rounded-lg transition-all duration-300 ${
          vizType ? 'h-24 mb-2' : 'h-0'
        }`}
      >
        <canvas
          ref={canvasRef}
          id="strudel-viz-canvas"
          className="w-full h-full block"
          style={{ background: '#09090b' }}
        />
      </div>
    </div>
  )
}
