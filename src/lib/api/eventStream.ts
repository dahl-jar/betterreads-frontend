import type { ZodType } from 'zod'

import { API_BASE_URL } from './client'

type EventStreamOptions<T> = {
  event: string
  schema: ZodType<T>
  once: boolean
  onEvent: (value: T) => void
  onError?: (() => void) | undefined
  onDisconnect?: (() => void) | undefined
}

const FIRST_RETRY_MS = 5_000
const MAX_RETRY_MS = 60_000
const RECONNECT_WINDOW_MS = 30 * 60_000

export function openEventStream<T>(path: string, options: EventStreamOptions<T>): () => void {
  const startedAt = Date.now()
  let source: EventSource | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let failures = 0
  let isClosed = false

  const close = () => {
    if (isClosed) {
      return
    }
    isClosed = true
    clearTimeout(retryTimer)
    source?.close()
  }

  const giveUp = () => {
    close()
    options.onError?.()
  }

  const reconnect = () => {
    source?.close()
    source = undefined
    const delay = Math.min(FIRST_RETRY_MS * 2 ** failures, MAX_RETRY_MS)
    failures += 1
    if (Date.now() + delay - startedAt > RECONNECT_WINDOW_MS) {
      giveUp()
      return
    }
    retryTimer = setTimeout(connect, delay)
  }

  const connect = () => {
    let current: EventSource
    try {
      current = new EventSource(`${API_BASE_URL}${path}`, { withCredentials: true })
    } catch {
      giveUp()
      return
    }
    source = current
    current.addEventListener(options.event, (event) => {
      if (isClosed) {
        return
      }
      const parsed = options.schema.safeParse(parseJson(event.data))
      if (options.once) {
        close()
      }
      if (parsed.success) {
        options.onEvent(parsed.data)
      } else {
        options.onError?.()
      }
    })
    current.onerror = () => {
      if (isClosed || current !== source) {
        return
      }
      options.onDisconnect?.()
      reconnect()
    }
  }

  connect()
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
