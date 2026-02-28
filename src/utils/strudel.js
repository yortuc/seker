export function buildEvalCode(lanes, bpm) {
  const activeLanes = lanes.filter(l => !l.muted)
  const soloLanes = activeLanes.filter(l => l.solo)
  const toPlay = soloLanes.length > 0 ? soloLanes : activeLanes
  if (toPlay.length === 0) return 'silence'

  return toPlay.map(lane =>
    `$: ${lane.baseCode}` +
    `.gain(${lane.params.gain.toFixed(2)})` +
    `.lpf(${Math.round(lane.params.lpf)})` +
    `.room(${lane.params.room.toFixed(2)})` +
    `.delay(${lane.params.delay.toFixed(2)})` +
    `.orbit(${lane.orbit})`
  ).join('\n')
}
