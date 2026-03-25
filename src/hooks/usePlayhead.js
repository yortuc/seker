import { useEffect, useRef, useState } from 'react'

export function usePlayhead(isPlaying, numSteps) {
  const [currentStep, setCurrentStep] = useState(-1)
  const prevStep = useRef(-1)

  useEffect(() => {
    if (!isPlaying) {
      setCurrentStep(-1)
      prevStep.current = -1
      return
    }
    let raf
    const tick = () => {
      const t = window.__strudelTime
      if (t != null) {
        const step = Math.floor((t % 1) * numSteps)
        if (step !== prevStep.current) {
          prevStep.current = step
          setCurrentStep(step)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, numSteps])

  return currentStep
}
