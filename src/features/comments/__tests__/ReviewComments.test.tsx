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
const THREAD_URL = `${BASE}/reviews/7/comments`
const SERVER_ERROR = 500

function commentPage(comments: Record<string, unknown>[], total = comments.length) {
  return HttpResponse.json({ data: comments, meta: { total, offset: 0, limit: 20 } })
}

function stubThread(comments: Record<string, unknown>[], total = comments.length) {
  const requests: string[] = []
  server.use(
    http.get(THREAD_URL, ({ request }) => {
      requests.push(request.url)
      return commentPage(comments, total)
    }),
  )
  return requests
}

async function openSignedInThread() {
  stubSignedIn()
  stubThread([comment])
  const { user } = renderWithProviders(<ReviewComments reviewId={7} commentCount={1} />)
  await user.click(await screen.findByRole('button', { name: '1 comment' }))
  return user
}

async function showReplies(
  replyCount: number,
  replies: Record<string, unknown>[],
  total = replies.length,
) {
  stubSignedOut()
  stubThread([{ ...comment, replyCount }])
  server.use(http.get(`${BASE}/comments/1/replies`, () => commentPage(replies, total)))
  const { user } = renderWithProviders(<ReviewComments reviewId={7} commentCount={1} />)
  await user.click(await screen.findByRole('button', { name: '1 comment' }))
  await user.click(await screen.findByRole('button', { name: `Show ${replyCount} replies` }))
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('ReviewComments', () => {
  it('should not load the thread until the reader opens it', async () => {
    let sessionChecked = false
    server.use(
      http.post(`${BASE}/auth/refresh`, () => {
        sessionChecked = true
        return new HttpResponse(null, { status: 401 })
      }),
    )
    const requests = stubThread([])

    renderWithProviders(<ReviewComments reviewId={7} commentCount={3} />)

    expect(await screen.findByRole('button', { name: '3 comments' })).toBeInTheDocument()
    await waitFor(() => expect(sessionChecked).toBe(true))
    expect(requests).toEqual([])
  })

  it('should show comments when opened', async () => {
    stubSignedOut()
    stubThread([comment])
    const { user } = renderWithProviders(<ReviewComments reviewId={7} commentCount={1} />)

    await user.click(await screen.findByRole('button', { name: '1 comment' }))

    expect(await screen.findByText('Comment 1')).toBeInTheDocument()
  })

  it('should show an alert when the comments cannot be loaded', async () => {
    stubSignedOut()
    server.use(http.get(THREAD_URL, () => new HttpResponse(null, { status: SERVER_ERROR })))
    const { user } = renderWithProviders(<ReviewComments reviewId={7} commentCount={1} />)

    await user.click(await screen.findByRole('button', { name: '1 comment' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load comments. Try again.',
    )
  })

  it('should offer more comments when some are not shown', async () => {
    stubSignedOut()
    stubThread([comment], 4)
    const { user } = renderWithProviders(
      <ReviewComments reviewId={7} commentCount={4} pageSize={1} />,
    )

    await user.click(await screen.findByRole('button', { name: '4 comments' }))

    expect(await screen.findByRole('button', { name: 'Show more comments' })).toBeInTheDocument()
  })

  it('should post a comment for a signed-in reader', async () => {
    stubSignedIn()
    stubThread([])
    let sent: unknown
    server.use(
      http.post(THREAD_URL, async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(
          { data: { ...comment, id: 9, body: 'My comment' } },
          { status: 201 },
        )
      }),
    )
    const { user } = renderWithProviders(<ReviewComments reviewId={7} commentCount={0} />)

    await user.click(await screen.findByRole('button', { name: 'Comment' }))
    await user.type(await screen.findByRole('textbox', { name: 'Add a comment' }), 'My comment')
    await user.click(screen.getByRole('button', { name: 'Post' }))

    await waitFor(() => expect(sent).toEqual({ body: 'My comment' }))
  })

  it('should count a posted comment once the thread is closed', async () => {
    server.use(
      http.post(THREAD_URL, () =>
        HttpResponse.json({ data: { ...comment, id: 9, body: 'My comment' } }, { status: 201 }),
      ),
    )
    const user = await openSignedInThread()
    await user.type(await screen.findByRole('textbox', { name: 'Add a comment' }), 'My comment')
    await user.click(screen.getByRole('button', { name: 'Post' }))
    await screen.findByText('My comment')

    await user.click(screen.getByRole('button', { name: 'Hide comments' }))

    expect(screen.getByRole('button', { name: '2 comments' })).toBeInTheDocument()
  })

  it('should keep the comment when posting fails', async () => {
    stubSignedIn()
    stubThread([])
    server.use(http.post(THREAD_URL, () => new HttpResponse(null, { status: SERVER_ERROR })))
    const { user } = renderWithProviders(<ReviewComments reviewId={7} />)
    await user.click(await screen.findByRole('button', { name: 'Comment' }))
    const draft = await screen.findByRole('textbox', { name: 'Add a comment' })
    await user.type(draft, 'Keep this draft')

    await user.click(screen.getByRole('button', { name: 'Post' }))

    expect(await screen.findByText('Could not post. Try again.')).toBeInTheDocument()
    expect(draft).toHaveValue('Keep this draft')
  })

  it('should give the reply textarea an accessible name', async () => {
    const user = await openSignedInThread()
    await user.click(await screen.findByRole('button', { name: 'Reply' }))

    expect(screen.getByRole('textbox', { name: 'Write a reply' })).toBeInTheDocument()
  })

  it('should load replies when expanded', async () => {
    await showReplies(2, [{ ...comment, id: 10, body: 'A reply' }])

    expect(await screen.findByText('A reply')).toBeInTheDocument()
  })

  it('should offer more replies when some are not shown', async () => {
    await showReplies(5, [{ ...comment, id: 10, body: 'First reply' }], 5)

    expect(await screen.findByRole('button', { name: 'Show more replies' })).toBeInTheDocument()
  })

  it('should place the comment box after the comments', async () => {
    await openSignedInThread()

    const posted = await screen.findByText('Comment 1')
    const box = screen.getByRole('textbox', { name: 'Add a comment' })
    expect(posted.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('should offer a log-in link to a signed-out reader', async () => {
    stubSignedOut()
    stubThread([])
    const { user } = renderWithProviders(<ReviewComments reviewId={7} />)

    await user.click(await screen.findByRole('button', { name: 'Comment' }))

    expect(await screen.findByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
  })

  it('should mark the toggle collapsed while the thread is closed', async () => {
    stubSignedOut()

    renderWithProviders(<ReviewComments reviewId={7} commentCount={3} />)

    expect(await screen.findByRole('button', { name: '3 comments' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('should mark the toggle expanded while the thread is open', async () => {
    stubSignedOut()
    stubThread([])
    const { user } = renderWithProviders(<ReviewComments reviewId={7} commentCount={3} />)

    await user.click(await screen.findByRole('button', { name: '3 comments' }))

    expect(await screen.findByRole('button', { name: 'Hide comments' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })
})
