import { useCallback, useEffect, useReducer, useState } from 'react'

import { checkBackendHealth } from '@/lib/api/checkBackendHealth'

type BackendAvailabilityStatus = 'checking' | 'available' | 'unavailable'

type BackendAvailability = {
  status: BackendAvailabilityStatus
  retry: () => void
}

function increment(attempt: number): number {
  return attempt + 1
}

export function useBackendAvailability(): BackendAvailability {
  const [attempt, startNextAttempt] = useReducer(increment, 0)
  const [status, setStatus] = useState<BackendAvailabilityStatus>('checking')

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    void checkBackendHealth(controller.signal).then((available) => {
      if (active) {
        setStatus(available ? 'available' : 'unavailable')
      }
    })

    return () => {
      active = false
      controller.abort()
    }
  }, [attempt])

  const retry = useCallback(() => {
    setStatus('checking')
    startNextAttempt()
  }, [])

  return { status, retry }
}
