import { useEffect, useState, useRef } from 'react'

export function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>()
  const startTime = useRef<number>()

  useEffect(() => {
    if (!start) return
    startTime.current = undefined
    const step = (ts: number) => {
      if (!startTime.current) startTime.current = ts
      const progress = Math.min((ts - startTime.current) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration, start])

  return value
}
