import { useEffect, useState } from 'react'

import { getMyShelfCounts } from '../api/getMyShelfCounts'
import { subscribeToShelfChanges } from '../api/shelfChanges'

export function useMyShelfTotal(enabled: boolean): number | undefined {
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [version, setVersion] = useState(0)
  const [wasEnabled, setWasEnabled] = useState(enabled)

  if (enabled !== wasEnabled) {
    setWasEnabled(enabled)
    setTotal(undefined)
  }

  useEffect(() => {
    if (!enabled) {
      return
    }
    return subscribeToShelfChanges(() => setVersion((current) => current + 1))
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      return
    }
    const controller = new AbortController()
    getMyShelfCounts(controller.signal)
      .then((counts) => {
        if (!controller.signal.aborted) {
          setTotal(counts.total)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setTotal(undefined)
        }
      })
    return () => controller.abort()
  }, [enabled, version])

  return total
}
