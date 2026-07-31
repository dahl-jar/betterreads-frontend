import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { useReviewComments } from '../hooks/useReviewComments'

import comment from './mocks/comment.json'

const BASE = 'http://localhost:8080/api/v1'

describe('useReviewComments', () => {
  it('should stay idle until loaded', () => {
    let requested = false
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () => {
        requested = true
        return HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } })
      }),
    )

    const { result } = renderHook(() => useReviewComments(7))

    expect(result.current.status).toBe('idle')
    expect(requested).toBe(false)
  })

  it('should load the first page when load is called', async () => {
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () =>
        HttpResponse.json({
          data: [comment, { ...comment, id: 2 }],
          meta: { total: 2, offset: 0, limit: 20 },
        }),
      ),
    )

    const { result } = renderHook(() => useReviewComments(7))

    await result.current.load()

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.comments).toHaveLength(2)
    expect(result.current.hasMore).toBe(false)
  })

  it('should flag more pages when the total exceeds the loaded count', async () => {
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () =>
        HttpResponse.json({
          data: [comment],
          meta: { total: 5, offset: 0, limit: 1 },
        }),
      ),
    )

    const { result } = renderHook(() => useReviewComments(7, 1))

    await result.current.load()

    await waitFor(() => expect(result.current.hasMore).toBe(true))
  })

  it('should append the next page when loadMore runs', async () => {
    server.use(
      http.get(`${BASE}/reviews/7/comments`, ({ request }) => {
        const offset = new URL(request.url).searchParams.get('offset')
        const id = offset === '0' ? 1 : 2
        return HttpResponse.json({
          data: [{ ...comment, id }],
          meta: { total: 2, offset: Number(offset), limit: 1 },
        })
      }),
    )

    const { result } = renderHook(() => useReviewComments(7, 1))
    await result.current.load()
    await waitFor(() => expect(result.current.comments).toHaveLength(1))

    await result.current.loadMore()

    await waitFor(() => expect(result.current.comments.map((entry) => entry.id)).toEqual([1, 2]))
    expect(result.current.hasMore).toBe(false)
  })

  it('should prepend a posted comment', async () => {
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () =>
        HttpResponse.json({
          data: [comment],
          meta: { total: 1, offset: 0, limit: 20 },
        }),
      ),
      http.post(`${BASE}/reviews/7/comments`, () =>
        HttpResponse.json({ data: { ...comment, id: 9 } }, { status: 201 }),
      ),
    )

    const { result } = renderHook(() => useReviewComments(7))
    await result.current.load()
    await waitFor(() => expect(result.current.status).toBe('success'))

    await result.current.post({ body: 'New one' })

    await waitFor(() => expect(result.current.comments[0]?.id).toBe(9))
    expect(result.current.total).toBe(2)
  })

  it('should report an error when the first page fails', async () => {
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () => new HttpResponse(null, { status: 503 })),
    )

    const { result } = renderHook(() => useReviewComments(7))

    await result.current.load()

    await waitFor(() => expect(result.current.status).toBe('error'))
  })

  it('should retry after a sustained failure', async () => {
    let fail = true
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () => {
        if (fail) {
          return new HttpResponse(null, { status: 500 })
        }
        return HttpResponse.json({
          data: [comment],
          meta: { total: 1, offset: 0, limit: 20 },
        })
      }),
    )
    const { result } = renderHook(() => useReviewComments(7))
    await result.current.load()
    await waitFor(() => expect(result.current.status).toBe('error'))

    fail = false
    await result.current.load()

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.comments).toHaveLength(1)
  })

  it('should keep a comment posted while the first page was loading', async () => {
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () =>
        HttpResponse.json({
          data: [comment],
          meta: { total: 1, offset: 0, limit: 20 },
        }),
      ),
      http.post(`${BASE}/reviews/7/comments`, () =>
        HttpResponse.json({ data: { ...comment, id: 9 } }, { status: 201 }),
      ),
    )
    const { result } = renderHook(() => useReviewComments(7))

    const loading = result.current.load()
    await result.current.post({ body: 'Raced in' })
    await loading

    await waitFor(() => expect(result.current.comments.map((entry) => entry.id)).toContain(9))
    expect(result.current.comments.map((entry) => entry.id)).toContain(1)
  })
})
