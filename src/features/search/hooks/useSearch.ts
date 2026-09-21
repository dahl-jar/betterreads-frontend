import { useEffect, useReducer } from 'react'

import { searchBooks, type BookSearchDocument } from '@/features/search/api/searchBooks'
import { subscribeToSearchHits } from '@/features/search/api/subscribeToSearchHits'

/** Uses `staging` for a successful first page with no hits. */
export type SearchStatus = 'idle' | 'loading' | 'success' | 'staging' | 'error'

export const PAGE_SIZE = 15

type SearchState = {
  status: SearchStatus
  hits: BookSearchDocument[]
  hasNextPage: boolean
  page: number
}

type SearchAction =
  | { type: 'reset' }
  | { type: 'start'; page: number }
  | { type: 'resolved'; hits: BookSearchDocument[]; hasNextPage: boolean; page: number }
  | { type: 'failed'; page: number }
  | { type: 'hit'; hit: BookSearchDocument }

const IDLE_STATE: SearchState = { status: 'idle', hits: [], hasNextPage: false, page: 1 }

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'hit':
      if (state.hits.some((hit) => hit.bookId === action.hit.bookId)) {
        return state
      }
      return { ...state, status: 'success', hits: [...state.hits, action.hit] }
    case 'reset':
      return IDLE_STATE
    case 'start':
      return { status: 'loading', hits: [], hasNextPage: false, page: action.page }
    case 'resolved':
      return {
        status: action.hits.length === 0 && action.page === 1 ? 'staging' : 'success',
        hits: action.hits,
        hasNextPage: action.hasNextPage,
        page: action.page,
      }
    case 'failed':
      return { status: 'error', hits: [], hasNextPage: false, page: action.page }
  }
}

/** Fetches one extra hit to determine whether another page exists. */
export function useSearch(query: string, page = 1): SearchState {
  const [state, dispatch] = useReducer(searchReducer, IDLE_STATE)
  const trimmed = query.trim()

  useEffect(() => {
    if (trimmed === '') {
      dispatch({ type: 'reset' })
      return
    }

    const controller = new AbortController()
    dispatch({ type: 'start', page })
    searchBooks({
      query: trimmed,
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE + 1,
      signal: controller.signal,
    })
      .then((result) => {
        if (!controller.signal.aborted) {
          dispatch({
            type: 'resolved',
            hits: result.hits.slice(0, PAGE_SIZE),
            hasNextPage: result.hits.length > PAGE_SIZE,
            page,
          })
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          dispatch({ type: 'failed', page })
        }
      })

    return () => controller.abort()
  }, [trimmed, page])

  const canStream = page === 1 && (state.status === 'success' || state.status === 'staging')

  useEffect(() => {
    if (!canStream) {
      return
    }
    return subscribeToSearchHits(trimmed, {
      onHit: (hit) => dispatch({ type: 'hit', hit }),
    })
  }, [trimmed, canStream])

  return state
}
