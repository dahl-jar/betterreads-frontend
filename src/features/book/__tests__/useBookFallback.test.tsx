import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/testing/msw-server'

import { useBook } from '../hooks/useBook'

const API_BASE_URL = 'http://localhost:8080/api/v1/books'
const POLL_INTERVAL_MS = 5_000
const POLL_ATTEMPT_LIMIT = 12
const POLL_TIMER_LOOP_LIMIT = 100

type BookEventListener = (event: MessageEvent<string>) => void

class FakeEventSource {
  static instances: FakeEventSource[] = []

  readonly listeners = new Map<string, BookEventListener>()
  onerror: ((event: Event) => void) | null = null
  closed = false

  constructor() {
    FakeEventSource.instances.push(this)
  }

  addEventListener(type: string, listener: BookEventListener) {
    this.listeners.set(type, listener)
  }

  emit(type: string, data: unknown) {
    this.listeners.get(type)?.(new MessageEvent(type, { data: JSON.stringify(data) }))
  }

  fail() {
    this.onerror?.(new Event('error'))
  }

  close() {
    this.closed = true
  }
}

function detail(key: string, complete: boolean, title = 'A Book') {
  return {
    key,
    complete,
    title,
    authors: ['An Author'],
    subjects: [],
    awards: [],
  }
}

afterEach(() => {
  FakeEventSource.instances = []
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useBook update fallback', () => {
  it('should poll after the stream fails', async () => {
    vi.stubGlobal('EventSource', FakeEventSource)
    let requestCount = 0
    server.use(
      http.get(`${API_BASE_URL}/key-1`, () => {
        requestCount += 1
        return HttpResponse.json({
          data: detail('key-1', requestCount > 1, requestCount > 1 ? 'Filled Book' : 'A Book'),
        })
      }),
    )

    const { result } = renderHook(() => useBook('key-1'))
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    const source = FakeEventSource.instances[0]
    if (!source) {
      throw new Error('EventSource was not opened')
    }
    vi.useFakeTimers({ loopLimit: POLL_TIMER_LOOP_LIMIT })
    act(() => {
      source.fail()
      source.fail()
    })
    await act(async () => vi.runAllTimersAsync())

    expect(source.closed).toBe(true)
    expect(result.current.book).toEqual(
      expect.objectContaining({ complete: true, title: 'Filled Book' }),
    )
    expect(requestCount).toBe(2)
  })

  it('should space incomplete polls five seconds apart', async () => {
    vi.stubGlobal('EventSource', FakeEventSource)
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    let requestCount = 0
    server.use(
      http.get(`${API_BASE_URL}/key-1`, () => {
        requestCount += 1
        return HttpResponse.json({ data: detail('key-1', false) })
      }),
    )

    const { result, unmount } = renderHook(() => useBook('key-1'))
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    act(() => FakeEventSource.instances[0]?.fail())
    await waitFor(() => expect(requestCount).toBe(2))

    expect(result.current.book?.complete).toBe(false)
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), POLL_INTERVAL_MS)
    unmount()
  })

  it('should abort fallback polling when the hook unmounts', async () => {
    vi.stubGlobal('EventSource', FakeEventSource)
    let requestCount = 0
    let pollSignal: AbortSignal | undefined
    let markPollStarted: () => void = () => undefined
    let releasePoll: () => void = () => undefined
    const pollStarted = new Promise<void>((resolve) => {
      markPollStarted = resolve
    })
    const heldPoll = new Promise<void>((resolve) => {
      releasePoll = resolve
    })
    server.use(
      http.get(`${API_BASE_URL}/key-1`, async ({ request }) => {
        requestCount += 1
        if (requestCount === 1) {
          return HttpResponse.json({ data: detail('key-1', false) })
        }
        pollSignal = request.signal
        markPollStarted()
        await heldPoll
        return HttpResponse.json({ data: detail('key-1', false) })
      }),
    )

    const { unmount } = renderHook(() => useBook('key-1'))
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    vi.useFakeTimers({ loopLimit: POLL_TIMER_LOOP_LIMIT })
    act(() => FakeEventSource.instances[0]?.fail())
    await vi.waitFor(() => expect(requestCount).toBe(2))
    await pollStarted

    unmount()
    expect(pollSignal?.aborted).toBe(true)
    releasePoll()
    await act(async () => vi.runAllTimersAsync())
    expect(requestCount).toBe(2)
  })

  it('should clear a scheduled fallback poll when the hook unmounts', async () => {
    vi.stubGlobal('EventSource', FakeEventSource)
    let requestCount = 0
    server.use(
      http.get(`${API_BASE_URL}/key-1`, () => {
        requestCount += 1
        return HttpResponse.json({ data: detail('key-1', false) })
      }),
    )

    const { unmount } = renderHook(() => useBook('key-1'))
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    vi.useFakeTimers({ loopLimit: POLL_TIMER_LOOP_LIMIT })
    act(() => FakeEventSource.instances[0]?.fail())
    await vi.waitFor(() => expect(requestCount).toBe(2))
    await act(async () => vi.advanceTimersByTimeAsync(0))

    unmount()
    expect(vi.getTimerCount()).toBe(0)
    await act(async () => vi.runAllTimersAsync())
    expect(requestCount).toBe(2)
  })

  it('should abort the old fallback poll when the book key changes', async () => {
    vi.stubGlobal('EventSource', FakeEventSource)
    let oldRequestCount = 0
    let oldPollSignal: AbortSignal | undefined
    let markOldPollStarted: () => void = () => undefined
    let releaseOldPoll: () => void = () => undefined
    const oldPollStarted = new Promise<void>((resolve) => {
      markOldPollStarted = resolve
    })
    const heldOldPoll = new Promise<void>((resolve) => {
      releaseOldPoll = resolve
    })
    server.use(
      http.get(`${API_BASE_URL}/key-1`, async ({ request }) => {
        oldRequestCount += 1
        if (oldRequestCount === 1) {
          return HttpResponse.json({ data: detail('key-1', false) })
        }
        oldPollSignal = request.signal
        markOldPollStarted()
        await heldOldPoll
        return HttpResponse.json({ data: detail('key-1', true, 'Old Book') })
      }),
      http.get(`${API_BASE_URL}/key-2`, () =>
        HttpResponse.json({ data: detail('key-2', true, 'Next Book') }),
      ),
    )

    const { rerender, result } = renderHook(({ bookKey }) => useBook(bookKey), {
      initialProps: { bookKey: 'key-1' },
    })
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    vi.useFakeTimers({ loopLimit: POLL_TIMER_LOOP_LIMIT })
    act(() => FakeEventSource.instances[0]?.fail())
    await vi.waitFor(() => expect(oldRequestCount).toBe(2))
    await oldPollStarted

    rerender({ bookKey: 'key-2' })
    expect(oldPollSignal?.aborted).toBe(true)
    releaseOldPoll()
    await act(async () => vi.runAllTimersAsync())
    expect(result.current.book?.key).toBe('key-2')
    expect(oldRequestCount).toBe(2)
  })

  it('should stop polling after twelve failed attempts', async () => {
    vi.stubGlobal('EventSource', FakeEventSource)
    let requestCount = 0
    server.use(
      http.get(`${API_BASE_URL}/key-1`, () => {
        requestCount += 1
        if (requestCount === 1) {
          return HttpResponse.json({ data: detail('key-1', false) })
        }
        return new HttpResponse(null, { status: 500 })
      }),
    )

    renderHook(() => useBook('key-1'))
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    vi.useFakeTimers({ loopLimit: POLL_TIMER_LOOP_LIMIT })
    act(() => FakeEventSource.instances[0]?.fail())
    await act(async () => vi.runAllTimersAsync())

    expect(requestCount).toBe(1 + POLL_ATTEMPT_LIMIT)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('should not poll after a successful stream update', async () => {
    vi.stubGlobal('EventSource', FakeEventSource)
    let requestCount = 0
    server.use(
      http.get(`${API_BASE_URL}/key-1`, () => {
        requestCount += 1
        return HttpResponse.json({ data: detail('key-1', false) })
      }),
    )

    const { result } = renderHook(() => useBook('key-1'))
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    vi.useFakeTimers({ loopLimit: POLL_TIMER_LOOP_LIMIT })
    act(() => FakeEventSource.instances[0]?.emit('book-updated', detail('key-1', true)))
    await act(async () => vi.runAllTimersAsync())

    expect(result.current.book?.complete).toBe(true)
    expect(requestCount).toBe(1)
  })

  it('should poll when EventSource cannot be constructed', async () => {
    vi.useFakeTimers({ loopLimit: POLL_TIMER_LOOP_LIMIT })
    vi.stubGlobal('EventSource', undefined)
    let requestCount = 0
    server.use(
      http.get(`${API_BASE_URL}/key-1`, () => {
        requestCount += 1
        return HttpResponse.json({ data: detail('key-1', requestCount > 1) })
      }),
    )

    const { result } = renderHook(() => useBook('key-1'))
    await act(async () => vi.runAllTimersAsync())

    expect(result.current.book?.complete).toBe(true)
    expect(requestCount).toBe(2)
  })
})
