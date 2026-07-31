import { useEffect, useReducer } from 'react'

import { getBookList, type BookCard, type BookListType } from '../api/getBookList'

export type BookListStatus = 'loading' | 'success' | 'error'

type BookListState = {
  status: BookListStatus
  cards: BookCard[]
}

type BookListAction =
  | { type: 'loading' }
  | { type: 'loaded'; cards: BookCard[] }
  | { type: 'failed' }

const INITIAL_STATE: BookListState = { status: 'loading', cards: [] }

function bookListReducer(_state: BookListState, action: BookListAction): BookListState {
  switch (action.type) {
    case 'loading':
      return INITIAL_STATE
    case 'loaded':
      return { status: 'success', cards: action.cards }
    case 'failed':
      return { status: 'error', cards: [] }
  }
}

export function useBookList(list: BookListType): BookListState {
  const [state, dispatch] = useReducer(bookListReducer, INITIAL_STATE)

  useEffect(() => {
    const controller = new AbortController()
    dispatch({ type: 'loading' })
    getBookList(list, controller.signal)
      .then((cards) => dispatch({ type: 'loaded', cards }))
      .catch(() => {
        if (!controller.signal.aborted) {
          dispatch({ type: 'failed' })
        }
      })
    return () => controller.abort()
  }, [list])

  return state
}
