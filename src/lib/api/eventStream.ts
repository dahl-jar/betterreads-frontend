import type { ZodType } from 'zod'

import { API_BASE_URL } from './client'

type EventStreamOptions<T> = {
  event: string
  schema: ZodType<T>
  once: boolean
  onEvent: (value: T) => void
  onError?: (() => void) | undefined
}

export function openEventStream<T>(path: string, options: EventStreamOptions<T>): () => void {
  let source: EventSource
  try {
    source = new EventSource(`${API_BASE_URL}${path}`, { withCredentials: true })
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

  source.addEventListener(options.event, (event) => {
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
