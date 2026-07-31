import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { useBookComments } from '../hooks/useBookComments'

import { makeComment } from './mocks/comment'

const BASE = 'http://localhost:8080/api/v1'

describe('useBookComments', () => {
  it("should load the book's comment thread by key", async () => {
    let path = ''
    server.use(
      http.get(`${BASE}/books/OL1W/comments`, ({ request }) => {
        path = new URL(request.url).pathname
        return HttpResponse.json({
          data: [makeComment(1)],
          meta: { total: 1, offset: 0, limit: 20 },
        })
      }),
    )

    const { result } = renderHook(() => useBookComments('OL1W'))
    await result.current.load()

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(path).toBe('/api/v1/books/OL1W/comments')
    expect(result.current.comments).toHaveLength(1)
  })

  it('should post a comment on the book', async () => {
    let sent: unknown
    server.use(
      http.get(`${BASE}/books/OL1W/comments`, () =>
        HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } }),
      ),
      http.post(`${BASE}/books/OL1W/comments`, async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ data: makeComment(9) }, { status: 201 })
      }),
    )
    const { result } = renderHook(() => useBookComments('OL1W'))
    await result.current.load()
    await waitFor(() => expect(result.current.status).toBe('success'))

    await result.current.post({ body: 'On the book' })

    expect(sent).toEqual({ body: 'On the book' })
    await waitFor(() => expect(result.current.comments[0]?.id).toBe(9))
  })
})
