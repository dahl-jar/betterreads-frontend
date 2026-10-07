import { useEffect, useReducer } from 'react'

import { loadResource } from '@/lib/api/loadResource'

import { getBook, type BookDetail } from '../api/getBook'
import { subscribeToBook } from '../api/subscribeToBook'

const POLL_INTERVAL_MS = 5_000
const POLL_ATTEMPT_LIMIT = 12

export type BookStatus = 'loading' | 'success' | 'notFound' | 'error'

type BookState = {
  status: BookStatus
  book: BookDetail | undefined
}

type BookAction =
  | { type: 'loading' }
  | { type: 'loaded'; book: BookDetail }
  | { type: 'notFound' }
  | { type: 'failed' }

const INITIAL_STATE: BookState = { status: 'loading', book: undefined }

function bookReducer(state: BookState, action: BookAction): BookState {
  switch (action.type) {
    case 'loading':
      return { status: 'loading', book: state.book }
    case 'loaded':
      return { status: 'success', book: action.book }
    case 'notFound':
      return { status: 'notFound', book: undefined }
    case 'failed':
      return { status: 'error', book: undefined }
  }
}

function startBookPolling(key: string, onBookComplete: (book: BookDetail) => void): () => void {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  let attemptCount = 0
  let isStopped = false

  const poll = async () => {
    attemptCount += 1
    try {
      const book = await getBook(key, controller.signal)
      if (isStopped) {
        return
      }
      if (book.complete) {
        onBookComplete(book)
        return
      }
    } catch {
      if (controller.signal.aborted) {
        return
      }
    }

    if (attemptCount < POLL_ATTEMPT_LIMIT) {
      timer = setTimeout(() => void poll(), POLL_INTERVAL_MS)
    }
  }

  void poll()
  return () => {
    isStopped = true
    if (timer !== undefined) {
      clearTimeout(timer)
    }
    controller.abort()
  }
}

/** Loads a book by key and fills incomplete detail through live updates or bounded polling. */
export function useBook(key: string): BookState {
  const [state, dispatch] = useReducer(bookReducer, INITIAL_STATE)

  useEffect(() => {
    dispatch({ type: 'loading' })
    return loadResource((signal) => getBook(key, signal), {
      onLoaded: (book) => dispatch({ type: 'loaded', book }),
      onNotFound: () => dispatch({ type: 'notFound' }),
      onFailed: () => dispatch({ type: 'failed' }),
    })
  }, [key])

  const coldKey = state.status === 'success' && state.book && !state.book.complete ? key : undefined

  useEffect(() => {
    if (coldKey === undefined) {
      return
    }

    let stopPolling: (() => void) | undefined
    const startPolling = () => {
      if (stopPolling !== undefined) {
        return
      }
      stopPolling = startBookPolling(coldKey, (book) => dispatch({ type: 'loaded', book }))
    }
    const unsubscribe = subscribeToBook(coldKey, {
      onUpdate: (book) => dispatch({ type: 'loaded', book }),
      onError: startPolling,
      onDisconnect: startPolling,
    })

    return () => {
      unsubscribe()
      stopPolling?.()
    }
  }, [coldKey])

  return state
}
