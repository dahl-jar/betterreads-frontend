import { openEventStream } from '@/lib/api/eventStream'

import { bookDetailSchema, type BookDetail } from './getBook'

type SubscribeOptions = {
  onUpdate: (book: BookDetail) => void
  onError?: () => void
}

export function subscribeToBook(key: string, options: SubscribeOptions): () => void {
  return openEventStream(`/api/v1/books/${encodeURIComponent(key)}/events`, {
    event: 'book-updated',
    schema: bookDetailSchema,
    once: true,
    onEvent: options.onUpdate,
    onError: options.onError,
  })
}
