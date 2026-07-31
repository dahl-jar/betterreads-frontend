import { useEffect, useReducer } from 'react'

import { getShelf } from '../api/getShelf'
import { type ReadingStatus, type ShelfEntry } from '../api/shelfSchemas'

export type ShelfStatus = 'loading' | 'success' | 'error'

type ShelfState = {
  status: ShelfStatus
  entries: ShelfEntry[]
}

type ShelfAction =
  | { type: 'loading' }
  | { type: 'loaded'; entries: ShelfEntry[] }
  | { type: 'failed' }

const INITIAL_STATE: ShelfState = { status: 'loading', entries: [] }

function shelfReducer(_state: ShelfState, action: ShelfAction): ShelfState {
  switch (action.type) {
    case 'loading':
      return { status: 'loading', entries: [] }
    case 'loaded':
      return { status: 'success', entries: action.entries }
    case 'failed':
      return { status: 'error', entries: [] }
  }
}

export function useShelf(filter?: ReadingStatus): ShelfState {
  const [state, dispatch] = useReducer(shelfReducer, INITIAL_STATE)

  useEffect(() => {
    const controller = new AbortController()
    dispatch({ type: 'loading' })
    getShelf(filter, controller.signal)
      .then((entries) => dispatch({ type: 'loaded', entries }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        void error
        dispatch({ type: 'failed' })
      })

    return () => controller.abort()
  }, [filter])

  return state
}
