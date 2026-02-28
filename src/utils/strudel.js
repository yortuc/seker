export function buildEvalCode(lanes, bpm, globalLpf = 8000) {
  const activeLanes = lanes.filter(l => !l.muted)
  const soloLanes = activeLanes.filter(l => l.solo)
  const toPlay = soloLanes.length > 0 ? soloLanes : activeLanes

  // setcpm embedded in the code is the only reliable way to set tempo —
  // calling it as a named import from @strudel/web doesn't work because it
  // is a global injected by initStrudel, not a module export.
  const tempoLine = `setcpm(${(bpm / 4).toFixed(4)})`

  if (toPlay.length === 0) return `${tempoLine}\nsilence`

  const lanelines = toPlay.map(lane =>
    `$: ${lane.baseCode}` +
    `.gain(${lane.params.gain.toFixed(2)})` +
    `.lpf(${Math.min(Math.round(globalLpf), Math.round(lane.params.lpf))})` +
    `.room(${lane.params.room.toFixed(2)})` +
    `.delay(${lane.params.delay.toFixed(2)})` +
    `.orbit(${lane.orbit})`
  ).join('\n')

  return `${tempoLine}\n${lanelines}`
}
