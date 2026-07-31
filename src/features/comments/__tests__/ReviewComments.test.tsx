import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn, stubSignedOut } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { ReviewComments } from '../components/ReviewComments'

import comment from './mocks/comment.json'

const BASE = 'http://localhost:8080/api/v1'
afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('ReviewComments', () => {
  it('should not load the thread until the reader opens it', async () => {
    stubSignedOut()
    let requested = false
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () => {
        requested = true
        return HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } })
      }),
    )

    renderWithProviders(<ReviewComments reviewId={7} commentCount={3} />)

    expect(await screen.findByRole('button', { name: /3 comments/i })).toBeInTheDocument()
    expect(requested).toBe(false)
  })

  it('should show comments when opened', async () => {
    stubSignedOut()
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () =>
        HttpResponse.json({
          data: [comment],
          meta: { total: 1, offset: 0, limit: 20 },
        }),
      ),
    )
    const { user } = renderWithProviders(<ReviewComments reviewId={7} commentCount={1} />)

    await user.click(await screen.findByRole('button', { name: /1 comment/i }))

    expect(await screen.findByText('Comment 1')).toBeInTheDocument()
  })

  it('should show a load-more control when more pages remain', async () => {
    stubSignedOut()
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () =>
        HttpResponse.json({
          data: [comment],
          meta: { total: 4, offset: 0, limit: 1 },
        }),
      ),
    )
    const { user } = renderWithProviders(
      <ReviewComments reviewId={7} commentCount={4} pageSize={1} />,
    )

    await user.click(await screen.findByRole('button', { name: /4 comments/i }))

    expect(await screen.findByRole('button', { name: /show more comments/i })).toBeInTheDocument()
  })

  it('should post a comment for a signed-in reader', async () => {
    stubSignedIn()
    let sent: unknown
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () =>
        HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } }),
      ),
      http.post(`${BASE}/reviews/7/comments`, async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(
          { data: { ...comment, id: 9, body: 'My comment' } },
          { status: 201 },
        )
      }),
    )
    const { user } = renderWithProviders(<ReviewComments reviewId={7} commentCount={0} />)

    await user.click(await screen.findByRole('button', { name: /comment/i }))
    await user.type(await screen.findByPlaceholderText(/add a comment/i), 'My comment')
    await user.click(screen.getByRole('button', { name: /^post$/i }))

    await waitFor(() => expect(sent).toEqual({ body: 'My comment' }))
  })

  it('should keep the comment when posting fails', async () => {
    stubSignedIn()
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () =>
        HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } }),
      ),
      http.post(`${BASE}/reviews/7/comments`, () => new HttpResponse(null, { status: 500 })),
    )
    const { user } = renderWithProviders(<ReviewComments reviewId={7} />)
    await user.click(await screen.findByRole('button', { name: /^comment$/i }))
    const comment = await screen.findByRole('textbox', { name: /add a comment/i })
    await user.type(comment, 'Keep this draft')

    await user.click(screen.getByRole('button', { name: /^post$/i }))

    expect(await screen.findByText(/could not post/i)).toBeInTheDocument()
    expect(comment).toHaveValue('Keep this draft')
  })

  it('should give the reply textarea an accessible name', async () => {
    stubSignedIn()
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () =>
        HttpResponse.json({
          data: [comment],
          meta: { total: 1, offset: 0, limit: 20 },
        }),
      ),
    )
    const { user } = renderWithProviders(<ReviewComments reviewId={7} commentCount={1} />)

    await user.click(await screen.findByRole('button', { name: /1 comment/i }))
    await user.click(await screen.findByRole('button', { name: /^reply$/i }))

    expect(screen.getByRole('textbox', { name: /write a reply/i })).toBeInTheDocument()
  })

  it('should load replies when expanded', async () => {
    stubSignedOut()
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () =>
        HttpResponse.json({
          data: [{ ...comment, replyCount: 2 }],
          meta: { total: 1, offset: 0, limit: 20 },
        }),
      ),
      http.get(`${BASE}/comments/1/replies`, () =>
        HttpResponse.json({
          data: [{ ...comment, id: 10, body: 'A reply' }],
          meta: { total: 1, offset: 0, limit: 20 },
        }),
      ),
    )
    const { user } = renderWithProviders(<ReviewComments reviewId={7} commentCount={1} />)

    await user.click(await screen.findByRole('button', { name: /1 comment/i }))
    await user.click(await screen.findByRole('button', { name: /show 2 replies/i }))

    expect(await screen.findByText('A reply')).toBeInTheDocument()
  })

  it('should paginate replies', async () => {
    stubSignedOut()
    server.use(
      http.get(`${BASE}/reviews/7/comments`, () =>
        HttpResponse.json({
          data: [{ ...comment, replyCount: 5 }],
          meta: { total: 1, offset: 0, limit: 20 },
        }),
      ),
      http.get(`${BASE}/comments/1/replies`, () =>
        HttpResponse.json({
          data: [{ ...comment, id: 10, body: 'First reply' }],
          meta: { total: 5, offset: 0, limit: 20 },
        }),
      ),
    )
    const { user } = renderWithProviders(<ReviewComments reviewId={7} commentCount={1} />)

    await user.click(await screen.findByRole('button', { name: /1 comment/i }))
    await user.click(await screen.findByRole('button', { name: /show 5 replies/i }))

    expect(await screen.findByRole('button', { name: /show more replies/i })).toBeInTheDocument()
  })
})
