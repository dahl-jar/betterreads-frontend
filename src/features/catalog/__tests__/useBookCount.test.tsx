import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { useBookCount } from '../hooks/useBookCount'

const COUNT_URL = 'http://localhost:8080/api/v1/books/count'

const FAST_POLL_MS = 20

describe('useBookCount', () => {
  it('should refresh the count on the poll interval', async () => {
    let total = 100
    server.use(http.get(COUNT_URL, () => HttpResponse.json({ data: { total: total++ } })))

    const { result } = renderHook(() => useBookCount(FAST_POLL_MS))

    await waitFor(() => expect(result.current.total).toBeDefined())
    const first = result.current.total ?? 0
    await waitFor(() => expect(result.current.total).toBeGreaterThan(first))
  })

  it('should keep the last count when a later poll fails', async () => {
    let calls = 0
    server.use(
      http.get(COUNT_URL, () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ data: { total: 100 } })
          : new HttpResponse(null, { status: 404 })
      }),
    )

    const { result } = renderHook(() => useBookCount(FAST_POLL_MS))

    await waitFor(() => expect(calls).toBeGreaterThan(1))
    expect(result.current.total).toBe(100)
  })
})
