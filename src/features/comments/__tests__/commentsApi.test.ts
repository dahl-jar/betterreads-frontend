import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { getCommentReplies } from '../api/getCommentReplies'
import { getReviewComments } from '../api/getReviewComments'
import { postReviewComment } from '../api/postReviewComment'

import { makeComment } from './mocks/comment'

const BASE = 'http://localhost:8080/api/v1'

describe('getReviewComments', () => {
  it('should return the page of comments with its total', async () => {
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () =>
        HttpResponse.json({
          data: [makeComment(), makeComment({ id: 2, replyCount: 3 })],
          meta: { total: 12, offset: 0, limit: 20 },
        }),
      ),
    )

    const page = await getReviewComments(7)

    expect(page.comments).toHaveLength(2)
    expect(page.total).toBe(12)
    expect(page.comments[1]?.replyCount).toBe(3)
  })

  it('should pass pagination query params', async () => {
    let url = ''
    server.use(
      http.get(`${BASE}/reviews/7/comments`, ({ request }) => {
        url = request.url
        return HttpResponse.json({ data: [], meta: { total: 0, offset: 40, limit: 20 } })
      }),
    )

    await getReviewComments(7, 40, 20)

    const params = new URL(url).searchParams
    expect(params.get('offset')).toBe('40')
    expect(params.get('limit')).toBe('20')
  })
})

describe('postReviewComment', () => {
  it('should post a top-level comment', async () => {
    let sent: unknown
    server.use(
      http.post(`${BASE}/reviews/7/comments`, async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ data: makeComment({ id: 5, body: 'Agreed.' }) }, { status: 201 })
      }),
    )

    const created = await postReviewComment(7, { body: 'Agreed.' })

    expect(sent).toEqual({ body: 'Agreed.' })
    expect(created.id).toBe(5)
  })

  it('should include the parent id when replying', async () => {
    let sent: unknown
    server.use(
      http.post(`${BASE}/reviews/7/comments`, async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ data: makeComment({ id: 6 }) }, { status: 201 })
      }),
    )

    await postReviewComment(7, { body: 'Replying.', parentCommentId: 5 })

    expect(sent).toEqual({ body: 'Replying.', parentCommentId: 5 })
  })
})

describe('getCommentReplies', () => {
  it('should return the replies to a comment', async () => {
    server.use(
      http.get(`${BASE}/comments/5/replies`, () =>
        HttpResponse.json({
          data: [makeComment({ id: 8 })],
          meta: { total: 1, offset: 0, limit: 20 },
        }),
      ),
    )

    const page = await getCommentReplies(5)

    expect(page.comments[0]?.id).toBe(8)
  })
})
