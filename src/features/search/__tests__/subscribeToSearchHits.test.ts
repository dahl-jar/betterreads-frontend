import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FakeEventSource } from '@/testing/fakeEventSource'
import searchHit from '@/testing/mocks/search-hit.json'

import { subscribeToSearchHits } from '../api/subscribeToSearchHits'

describe('subscribeToSearchHits', () => {
  beforeEach(() => {
    vi.stubGlobal('EventSource', FakeEventSource)
  })

  it('should open a stream to the search events endpoint with the encoded query', () => {
    subscribeToSearchHits('robert jordan', { onHit: vi.fn() })

    expect(FakeEventSource.instances[0]?.url).toContain(
      '/api/v1/search/books/events?q=robert%20jordan',
    )
  })

  it('should deliver each hit and keep the stream open', () => {
    const onHit = vi.fn()
    subscribeToSearchHits('dune', { onHit })
    const source = FakeEventSource.instances[0]!

    source.emit('search-hit', searchHit)
    source.emit('search-hit', { ...searchHit, bookId: 'OL2W' })

    expect(onHit).toHaveBeenCalledTimes(2)
    expect(source.closed).toBe(false)
  })

  it('should skip a malformed hit and keep the stream open', () => {
    const onHit = vi.fn()
    subscribeToSearchHits('dune', { onHit })
    const source = FakeEventSource.instances[0]!

    source.emit('search-hit', { bookId: 'OL2W' })

    expect(onHit).not.toHaveBeenCalled()
    expect(source.closed).toBe(false)
  })
})
