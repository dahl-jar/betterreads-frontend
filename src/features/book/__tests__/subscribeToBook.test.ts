import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FakeEventSource, ThrowingEventSource } from '@/testing/fakeEventSource'

import { subscribeToBook } from '../api/subscribeToBook'

import sparseDetail from './mocks/book-detail-sparse.json'

const validDetail = {
  ...sparseDetail,
  key: 'key-1',
  complete: true,
  title: 'A Book',
  description: 'Now enriched.',
}

describe('subscribeToBook', () => {
  beforeEach(() => {
    vi.stubGlobal('EventSource', FakeEventSource)
  })

  it('should open a stream to the events endpoint for the key', () => {
    subscribeToBook('key-1', { onUpdate: vi.fn() })

    expect(FakeEventSource.instances[0]?.url).toContain('/api/v1/books/key-1/events')
  })

  it('should process one book update', () => {
    const onUpdate = vi.fn()
    subscribeToBook('key-1', { onUpdate })
    const source = FakeEventSource.instances[0]!

    source.emit('book-updated', validDetail)

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'key-1',
        complete: true,
        description: 'Now enriched.',
      }),
    )
    expect(source.closed).toBe(true)
  })

  it('should report a malformed payload without calling onUpdate', () => {
    const onUpdate = vi.fn()
    const onError = vi.fn()
    subscribeToBook('key-1', { onUpdate, onError })
    const source = FakeEventSource.instances[0]!

    source.emit('book-updated', { key: 'key-1' })

    expect(onUpdate).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledOnce()
    expect(source.closed).toBe(true)
  })

  it('should report a connection failure when EventSource construction throws', () => {
    vi.stubGlobal('EventSource', ThrowingEventSource)
    const onError = vi.fn()

    subscribeToBook('key-1', { onUpdate: vi.fn(), onError })

    expect(onError).toHaveBeenCalledOnce()
  })

  it('should close the stream when the returned unsubscribe is called', () => {
    const stop = subscribeToBook('key-1', { onUpdate: vi.fn() })
    const source = FakeEventSource.instances[0]!

    stop()

    expect(source.closed).toBe(true)
  })
})
