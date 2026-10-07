import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { FakeEventSource } from '@/testing/fakeEventSource'

import { openEventStream } from './eventStream'

const FIRST_RETRY_MS = 5_000
const MAX_RETRY_MS = 60_000
const RECONNECT_WINDOW_MS = 30 * 60_000

function open(onError = vi.fn()) {
  return openEventStream('/api/v1/books/key-1/events', {
    event: 'book-updated',
    schema: z.object({ key: z.string() }),
    once: true,
    onEvent: vi.fn(),
    onError,
  })
}

function latest() {
  return FakeEventSource.instances.at(-1)!
}

async function failFor(durationMs: number) {
  const startedAt = Date.now()
  while (Date.now() - startedAt <= durationMs) {
    latest().fail()
    await vi.advanceTimersByTimeAsync(MAX_RETRY_MS)
  }
}

describe('openEventStream', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('EventSource', FakeEventSource)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should reopen the stream after an error', async () => {
    const onError = vi.fn()
    open(onError)

    latest().fail()
    await vi.advanceTimersByTimeAsync(FIRST_RETRY_MS)

    expect(FakeEventSource.instances).toHaveLength(2)
    expect(FakeEventSource.instances[0]?.closed).toBe(true)
    expect(onError).not.toHaveBeenCalled()
  })

  it('should give up and report an error after thirty minutes', async () => {
    const onError = vi.fn()
    open(onError)

    await failFor(RECONNECT_WINDOW_MS)
    const opened = FakeEventSource.instances.length
    await vi.advanceTimersByTimeAsync(MAX_RETRY_MS)

    expect(opened).toBeGreaterThan(1)
    expect(onError).toHaveBeenCalledOnce()
    expect(FakeEventSource.instances).toHaveLength(opened)
  })

  it('should space reconnects 5, 10, 20, 40 and then 60 seconds apart', async () => {
    open()

    for (const [index, delay] of [5_000, 10_000, 20_000, 40_000, 60_000, 60_000].entries()) {
      latest().fail()
      await vi.advanceTimersByTimeAsync(delay - 1)
      expect(FakeEventSource.instances).toHaveLength(index + 1)
      await vi.advanceTimersByTimeAsync(1)
      expect(FakeEventSource.instances).toHaveLength(index + 2)
    }
  })

  it('should reconnect once when a dropped stream errors again', async () => {
    open()
    const first = latest()

    first.fail()
    first.fail()
    await vi.advanceTimersByTimeAsync(FIRST_RETRY_MS)

    expect(FakeEventSource.instances).toHaveLength(2)
  })

  it('should stop reconnecting once closed', async () => {
    const close = open()

    latest().fail()
    close()
    await vi.advanceTimersByTimeAsync(MAX_RETRY_MS)

    expect(FakeEventSource.instances).toHaveLength(1)
  })
})
