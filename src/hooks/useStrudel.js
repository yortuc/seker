import { useCallback, useRef, useState } from 'react'

export function useStrudel() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState(null)
  const initialized = useRef(false)
  const warmedUp = useRef(false)
  const debounceTimer = useRef(null)

  const init = useCallback(async () => {
    if (initialized.current) return
    const { initStrudel, samples } = await import('@strudel/web')
    await initStrudel({
      prebake: () => samples('github:tidalcycles/Dirt-Samples/master/'),
    })
    initialized.current = true
  }, [])

  const play = useCallback(async (code) => {
    try {
      setIsInitializing(true)
      await init()
      const { evaluate, hush } = await import('@strudel/web')

      // First play: silently evaluate common drum sounds to trigger their
      // downloads, then wait for them to buffer before real playback starts.
      if (!warmedUp.current) {
        warmedUp.current = true
        await evaluate('s("bd sd hh ho cp mt ht lt rim cb arpy pluck bass moog juno gtr").gain(0)')
        await new Promise(r => setTimeout(r, 2000))
        hush()
      }

      await evaluate(code)
      setIsPlaying(true)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsInitializing(false)
    }
  }, [init])

  const stop = useCallback(async () => {
    try {
      const { hush } = await import('@strudel/web')
      hush()
    } catch (_) {}
    setIsPlaying(false)
  }, [])

  const updateBpm = useCallback(async (bpm) => {
    try {
      const { setcpm } = await import('@strudel/web')
      setcpm(bpm / 4)
    } catch (_) {}
  }, [])

  const debouncedPlay = useCallback((code, delay = 80) => {
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => play(code), delay)
  }, [play])

  return { isPlaying, isInitializing, error, play, stop, updateBpm, debouncedPlay }
}
