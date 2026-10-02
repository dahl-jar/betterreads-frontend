import { useCallback, useEffect, useRef, useState } from 'react'

const PAGE_FRACTION = 0.8

export function useStripScroll(itemCount: number) {
  const ref = useRef<HTMLUListElement>(null)
  const [canScrollBack, setCanScrollBack] = useState(false)
  const [canScrollForward, setCanScrollForward] = useState(false)

  const measure = useCallback(() => {
    const strip = ref.current
    if (!strip) {
      return
    }
    setCanScrollBack(strip.scrollLeft > 0)
    setCanScrollForward(strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1)
  }, [])

  const scrollByPage = useCallback((direction: 1 | -1) => {
    const strip = ref.current
    if (!strip) {
      return
    }
    strip.scrollBy({ left: direction * strip.clientWidth * PAGE_FRACTION, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure, itemCount])

  return { ref, canScrollBack, canScrollForward, measure, scrollByPage }
}
