import { useEffect, useReducer } from 'react'

import { searchAuthors, type AuthorSearchDocument } from '../api/searchAuthors'

const AUTHOR_ROW_SIZE = 8

export type AuthorSearchStatus = 'idle' | 'loading' | 'success' | 'error'

type AuthorSearchState = {
  status: AuthorSearchStatus
  hits: AuthorSearchDocument[]
}

type AuthorSearchAction =
  | { type: 'reset' }
  | { type: 'start' }
  | { type: 'resolved'; hits: AuthorSearchDocument[] }
  | { type: 'failed' }

const IDLE_STATE: AuthorSearchState = { status: 'idle', hits: [] }

function authorSearchReducer(
  _state: AuthorSearchState,
  action: AuthorSearchAction,
): AuthorSearchState {
  switch (action.type) {
    case 'reset':
      return IDLE_STATE
    case 'start':
      return { status: 'loading', hits: [] }
    case 'resolved':
      return { status: 'success', hits: action.hits }
    case 'failed':
      return { status: 'error', hits: [] }
  }
}

export function useAuthorSearch(query: string): AuthorSearchState {
  const [state, dispatch] = useReducer(authorSearchReducer, IDLE_STATE)
  const trimmed = query.trim()

  useEffect(() => {
    if (trimmed === '') {
      dispatch({ type: 'reset' })
      return
    }

    const controller = new AbortController()
    dispatch({ type: 'start' })
    searchAuthors({ query: trimmed, limit: AUTHOR_ROW_SIZE, signal: controller.signal })
      .then((hits) => {
        if (!controller.signal.aborted) {
          dispatch({ type: 'resolved', hits })
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          dispatch({ type: 'failed' })
        }
      })

    return () => controller.abort()
  }, [trimmed])

  return state
}
