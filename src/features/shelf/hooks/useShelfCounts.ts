import { useEffect, useState } from 'react'

import { getShelfCounts, type ShelfCounts } from '../api/getShelfCounts'

export function useShelfCounts(key: string): ShelfCounts | undefined {
  const [result, setResult] = useState<{
    key: string
    counts: ShelfCounts | undefined
  }>({ key: '', counts: undefined })

  useEffect(() => {
    const controller = new AbortController()
    getShelfCounts(key, controller.signal)
      .then((counts) => {
        if (!controller.signal.aborted) {
          setResult({ key, counts })
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({ key, counts: undefined })
        }
      })
    return () => controller.abort()
  }, [key])

  return result.key === key ? result.counts : undefined
}
