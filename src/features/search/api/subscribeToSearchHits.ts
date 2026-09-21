import { openEventStream } from '@/lib/api/eventStream'

import { bookSearchDocumentSchema, type BookSearchDocument } from './searchBooks'

type SubscribeOptions = {
  onHit: (hit: BookSearchDocument) => void
  onError?: () => void
}

export function subscribeToSearchHits(query: string, options: SubscribeOptions): () => void {
  return openEventStream(`/api/v1/search/books/events?q=${encodeURIComponent(query)}`, {
    event: 'search-hit',
    schema: bookSearchDocumentSchema,
    once: false,
    onEvent: options.onHit,
    onError: options.onError,
  })
}
