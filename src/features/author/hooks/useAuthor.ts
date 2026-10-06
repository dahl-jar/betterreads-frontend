import { useEffect, useReducer } from 'react'

import { loadResource } from '@/lib/api/loadResource'

import { getAuthor, type AuthorPage } from '../api/getAuthor'

export type AuthorStatus = 'loading' | 'success' | 'notFound' | 'error'

type AuthorState = {
  status: AuthorStatus
  author: AuthorPage | undefined
}

type AuthorAction =
  | { type: 'loading' }
  | { type: 'loaded'; author: AuthorPage }
  | { type: 'notFound' }
  | { type: 'failed' }

const INITIAL_STATE: AuthorState = { status: 'loading', author: undefined }

function authorReducer(_state: AuthorState, action: AuthorAction): AuthorState {
  switch (action.type) {
    case 'loading':
      return INITIAL_STATE
    case 'loaded':
      return { status: 'success', author: action.author }
    case 'notFound':
      return { status: 'notFound', author: undefined }
    case 'failed':
      return { status: 'error', author: undefined }
  }
}

export function useAuthor(authorId: number): AuthorState {
  const [state, dispatch] = useReducer(authorReducer, INITIAL_STATE)

  useEffect(() => {
    dispatch({ type: 'loading' })
    return loadResource((signal) => getAuthor(authorId, signal), {
      onLoaded: (author) => dispatch({ type: 'loaded', author }),
      onNotFound: () => dispatch({ type: 'notFound' }),
      onFailed: () => dispatch({ type: 'failed' }),
    })
  }, [authorId])

  return state
}
