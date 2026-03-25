import { useEffect, useRef } from 'react'

export default function VizPanel() {
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
      <div
        ref={containerRef}
        className="h-24 mb-2 overflow-hidden rounded-lg"
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
