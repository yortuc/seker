import { buildEffectsChain, migrateParams } from './effects.js'

export function buildEvalCode(lanes, bpm, globalLpf = 8000, vizType = null) {
  const activeLanes = lanes.filter(l => !l.muted)
  const soloLanes = activeLanes.filter(l => l.solo)
  const toPlay = soloLanes.length > 0 ? soloLanes : activeLanes

  // setcpm embedded in the code is the only reliable way to set tempo —
  // calling it as a named import from @strudel/web doesn't work because it
  // is a global injected by initStrudel, not a module export.
  const tempoLine = `setcpm(${(bpm / 4).toFixed(4)})`

  if (toPlay.length === 0) return `${tempoLine}\nsilence`

  const analyzeClause = vizType ? `.analyze(1)` : ''

  const lanelines = toPlay.map(lane =>
    `$: ${lane.baseCode}` +
    buildEffectsChain(migrateParams(lane.params), globalLpf) +
    `.orbit(${lane.orbit})` +
    analyzeClause
  ).join('\n')

  const vizLine = vizType
    ? `\n$: silence.${vizType}({ctx: document.getElementById('strudel-viz-canvas')?.getContext('2d'), id: 1})`
    : ''

  const clockLine = `\n$: silence.draw((_,t)=>{window.__strudelTime=t},{id:"clock"})`

  return `${tempoLine}\n${lanelines}${vizLine}${clockLine}`
}
