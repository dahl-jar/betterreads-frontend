import { useEffect, useState } from 'react'

import { getShelf } from '../api/getShelf'
import { type ShelfEntry } from '../api/shelfSchemas'

type ShelfStatus = 'loading' | 'success' | 'error'

type ShelfState = {
  status: ShelfStatus
  entries: ShelfEntry[]
}

export function useShelf(): ShelfState {
  const [state, setState] = useState<ShelfState>({ status: 'loading', entries: [] })

  useEffect(() => {
    const controller = new AbortController()
    getShelf(controller.signal)
      .then((entries) => setState({ status: 'success', entries }))
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', entries: [] })
        }
      })

    return () => controller.abort()
  }, [])

  return state
}
