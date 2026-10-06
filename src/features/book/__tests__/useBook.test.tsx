import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/testing/msw-server'

import type { BookDetail } from '../api/getBook'
import { useBook } from '../hooks/useBook'

import sparseDetail from './mocks/book-detail-sparse.json'

const BOOK_URL = 'http://localhost:8080/api/v1/books/key-1'

type SubscribeOptions = {
  onUpdate: (book: BookDetail) => void
  onError?: () => void
}

type SubscribeArgs = [string, SubscribeOptions]

const subscribeMock = vi.hoisted(() =>
  vi.fn<(...args: SubscribeArgs) => () => void>(() => () => undefined),
)

vi.mock('../api/subscribeToBook', () => ({
  subscribeToBook: (key: string, options: SubscribeOptions) => subscribeMock(key, options),
}))

afterEach(() => {
  subscribeMock.mockClear()
})

function body(overrides: Record<string, unknown> = {}) {
  return { ...sparseDetail, key: 'key-1', complete: true, title: 'A Book', ...overrides }
}

describe('useBook', () => {
  it('should expose the loaded book', async () => {
    server.use(http.get(BOOK_URL, () => HttpResponse.json({ data: body() })))

    const { result } = renderHook(() => useBook('key-1'))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.book?.title).toBe('A Book')
  })

  it('should report not-found when the book does not exist', async () => {
    server.use(http.get(BOOK_URL, () => new HttpResponse(null, { status: 404 })))

    const { result } = renderHook(() => useBook('key-1'))

    await waitFor(() => expect(result.current.status).toBe('notFound'))
  })

  it('should report an error on a server failure', async () => {
    server.use(http.get(BOOK_URL, () => new HttpResponse(null, { status: 500 })))

    const { result } = renderHook(() => useBook('key-1'))

    await waitFor(() => expect(result.current.status).toBe('error'))
  })

  it('should not open a stream for an already-complete book', async () => {
    server.use(http.get(BOOK_URL, () => HttpResponse.json({ data: body({ complete: true }) })))

    const { result } = renderHook(() => useBook('key-1'))
    await waitFor(() => expect(result.current.status).toBe('success'))

    expect(subscribeMock).not.toHaveBeenCalled()
  })

  it('should update a cold book from the stream', async () => {
    server.use(http.get(BOOK_URL, () => HttpResponse.json({ data: body({ complete: false }) })))

    const { result } = renderHook(() => useBook('key-1'))
    await waitFor(() => expect(subscribeMock).toHaveBeenCalledTimes(1))

    const firstCall = subscribeMock.mock.calls[0]
    if (!firstCall) {
      throw new Error('subscribeToBook was not called')
    }
    const { onUpdate } = firstCall[1]
    onUpdate(body({ complete: true, title: 'A Book', description: 'Now filled in.' }))

    await waitFor(() => expect(result.current.book?.description).toBe('Now filled in.'))
    expect(result.current.book?.complete).toBe(true)
  })
})
