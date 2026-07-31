import { bookDetailSchema, type BookDetail } from './getBook'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

const EVENT_NAME = 'book-updated'

type EventSourceFactory = (url: string) => EventSource

type SubscribeOptions = {
  onUpdate: (book: BookDetail) => void
  onError?: () => void
  eventSourceFactory?: EventSourceFactory
}

/** Closes after the first validated `book-updated` event. */
export function subscribeToBook(key: string, options: SubscribeOptions): () => void {
  const factory =
    options.eventSourceFactory ?? ((url: string) => new EventSource(url, { withCredentials: true }))
  let source: EventSource
  try {
    source = factory(`${API_BASE_URL}/api/v1/books/${encodeURIComponent(key)}/events`)
  } catch {
    options.onError?.()
    return () => undefined
  }
  let isClosed = false
  const close = () => {
    if (isClosed) {
      return
    }
    isClosed = true
    source.close()
  }

  source.addEventListener(EVENT_NAME, (event) => {
    if (isClosed) {
      return
    }
    const parsed = bookDetailSchema.safeParse(parseJson(event.data))
    close()
    if (parsed.success) {
      options.onUpdate(parsed.data)
    } else {
      options.onError?.()
    }
  })
  source.onerror = () => {
    if (isClosed) {
      return
    }
    close()
    options.onError?.()
  }

  return close
}

function parseJson(raw: unknown): unknown {
  if (typeof raw !== 'string') {
    return undefined
  }
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}
