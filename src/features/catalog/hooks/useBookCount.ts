import { useEffect, useState } from 'react'

import { getBookCount } from '../api/getBookCount'

const COUNT_POLL_INTERVAL_MS = 30_000

type BookCountState =
  | { status: 'loading'; total: undefined }
  | { status: 'success'; total: number }
  | { status: 'error'; total: undefined }

export function useBookCount(pollIntervalMs = COUNT_POLL_INTERVAL_MS): BookCountState {
  const [state, setState] = useState<BookCountState>({ status: 'loading', total: undefined })

  useEffect(() => {
    const controller = new AbortController()

    const load = () => {
      if (document.hidden) {
        return
      }
      getBookCount(controller.signal)
        .then((total) =>
          setState((current) =>
            current.status === 'success' && current.total === total
              ? current
              : { status: 'success', total },
          ),
        )
        .catch(() => {
          if (!controller.signal.aborted) {
            setState((current) =>
              current.status === 'success' ? current : { status: 'error', total: undefined },
            )
          }
        })
    }

    load()
    const timer = setInterval(load, pollIntervalMs)
    document.addEventListener('visibilitychange', load)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', load)
      controller.abort()
    }
  }, [pollIntervalMs])

  return state
}
