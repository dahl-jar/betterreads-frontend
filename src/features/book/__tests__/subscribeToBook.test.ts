import { afterEach, describe, expect, it, vi } from 'vitest'

import { subscribeToBook } from '../api/subscribeToBook'

type Listener = (event: { data: string }) => void

class FakeEventSource {
  static instances: FakeEventSource[] = []
  url: string
  listeners = new Map<string, Listener>()
  onerror: ((event: unknown) => void) | null = null
  closed = false

  constructor(url: string) {
    this.url = url
    FakeEventSource.instances.push(this)
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners.set(type, listener)
  }

  emit(type: string, data: unknown) {
    this.listeners.get(type)?.({ data: JSON.stringify(data) })
  }

  close() {
    this.closed = true
  }
}

const validDetail = {
  key: 'key-1',
  complete: true,
  title: 'A Book',
  authors: ['An Author'],
  description: 'Now enriched.',
  subjects: [],
  awards: [],
}

afterEach(() => {
  FakeEventSource.instances = []
})

describe('subscribeToBook', () => {
  it('should open a stream to the events endpoint for the key', () => {
    subscribeToBook('key-1', {
      onUpdate: vi.fn(),
      eventSourceFactory: makeFactory(),
    })

    expect(FakeEventSource.instances[0]?.url).toContain('/api/v1/books/key-1/events')
  })

  it('should process one book update', () => {
    const onUpdate = vi.fn()
    subscribeToBook('key-1', { onUpdate, eventSourceFactory: makeFactory() })
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
    subscribeToBook('key-1', {
      onUpdate,
      onError,
      eventSourceFactory: makeFactory(),
    })
    const source = FakeEventSource.instances[0]!

    source.emit('book-updated', { key: 'key-1' })

    expect(onUpdate).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledOnce()
    expect(source.closed).toBe(true)
  })

  it('should report a connection failure when EventSource construction throws', () => {
    const onError = vi.fn()
    const throwingFactory = () => {
      throw new Error('connection failed')
    }

    subscribeToBook('key-1', {
      onUpdate: vi.fn(),
      onError,
      eventSourceFactory: throwingFactory,
    })

    expect(onError).toHaveBeenCalledOnce()
  })

  it('should close the stream when the returned unsubscribe is called', () => {
    const stop = subscribeToBook('key-1', {
      onUpdate: vi.fn(),
      eventSourceFactory: makeFactory(),
    })
    const source = FakeEventSource.instances[0]!

    stop()

    expect(source.closed).toBe(true)
  })
})

function makeFactory() {
  return (url: string) => new FakeEventSource(url) as unknown as EventSource
}
