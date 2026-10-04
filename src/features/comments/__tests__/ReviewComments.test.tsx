import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { clearDrafts, writeDraft } from '@/lib/draftStore'
import { stubSignedIn, stubSignedOut } from '@/testing/authHandlers'
import draft from '@/testing/mocks/draft.json'
import { server } from '@/testing/msw-server'
import {
  cleanup as screenCleanup,
  renderWithProviders,
  screen,
  type userEvent,
  waitFor,
  within,
} from '@/testing/test-utils'

import { ReviewComments } from '../components/ReviewComments'

import comment from './mocks/comment.json'

const BASE = 'http://localhost:8080/api/v1'
const THREAD_URL = `${BASE}/reviews/7/comments`
const SERVER_ERROR = 500

type User = ReturnType<typeof userEvent.setup>

function commentPage(comments: Record<string, unknown>[], total = comments.length) {
  return HttpResponse.json({ data: comments, meta: { total, offset: 0, limit: 20 } })
}

function stubThread(comments: Record<string, unknown>[], total = comments.length) {
  server.use(http.get(THREAD_URL, () => commentPage(comments, total)))
}

function stubPost(body: string) {
  server.use(
    http.post(THREAD_URL, () =>
      HttpResponse.json({ data: { ...comment, id: 9, body } }, { status: 201 }),
    ),
  )
}

function openSignedInThread() {
  stubSignedIn()
  stubThread([comment])
  return renderWithProviders(<ReviewComments reviewId={7} />).user
}

async function typeComment(user: User, text: string) {
  const box = await screen.findByRole('textbox', { name: 'Add a comment' })
  await user.type(box, text)
  return box
}

async function showReplies(
  replyCount: number,
  replies: Record<string, unknown>[],
  total = replies.length,
) {
  stubSignedOut()
  stubThread([{ ...comment, replyCount }])
  server.use(http.get(`${BASE}/comments/1/replies`, () => commentPage(replies, total)))
  const { user } = renderWithProviders(<ReviewComments reviewId={7} />)
  await user.click(await screen.findByRole('button', { name: `Show ${replyCount} replies` }))
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
  clearDrafts()
})

describe('ReviewComments', () => {
  it('should show the comments', async () => {
    stubSignedOut()
    stubThread([comment])

    renderWithProviders(<ReviewComments reviewId={7} />)

    expect(await screen.findByText('Comment 1')).toBeInTheDocument()
  })

  it('should show an alert when the comments cannot be loaded', async () => {
    stubSignedOut()
    server.use(http.get(THREAD_URL, () => new HttpResponse(null, { status: SERVER_ERROR })))

    renderWithProviders(<ReviewComments reviewId={7} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load comments. Try again.',
    )
  })

  it('should offer more comments when some are not shown', async () => {
    stubSignedOut()
    stubThread([comment], 40)

    renderWithProviders(<ReviewComments reviewId={7} />)

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
    const { user } = renderWithProviders(<ReviewComments reviewId={7} />)
    await typeComment(user, 'My comment')

    await user.click(screen.getByRole('button', { name: 'Post' }))

    await waitFor(() => expect(sent).toEqual({ body: 'My comment' }))
  })

  it('should keep the comment as a draft when posting fails', async () => {
    stubSignedIn()
    stubThread([])
    server.use(http.post(THREAD_URL, () => new HttpResponse(null, { status: SERVER_ERROR })))
    const { user } = renderWithProviders(<ReviewComments reviewId={7} />)
    const box = await typeComment(user, 'Keep this draft')

    await user.click(screen.getByRole('button', { name: 'Post' }))

    expect(
      await screen.findByText('Could not post. Your text is saved as a draft. Try again.'),
    ).toBeInTheDocument()
    expect(box).toHaveValue('Keep this draft')
  })

  it('should bring back an unposted comment when the thread opens again', async () => {
    const user = openSignedInThread()
    await typeComment(user, 'Half a thought')
    screenCleanup()
    stubThread([comment])

    renderWithProviders(<ReviewComments reviewId={7} />)

    expect(await screen.findByRole('textbox', { name: 'Add a comment' })).toHaveValue(
      'Half a thought',
    )
  })

  it('should say the comment is saved as a draft while typing', async () => {
    const user = openSignedInThread()

    await typeComment(user, 'Half a thought')

    expect(screen.getByText(/^Draft saved/)).toBeInTheDocument()
  })

  it('should say when an older draft was saved', async () => {
    stubSignedIn()
    stubThread([comment])
    renderWithProviders(<ReviewComments reviewId={7} />)
    await screen.findByText('Comment 1')

    writeDraft('user', 'review-comment:7', draft)

    expect(await screen.findByText('Draft from Jan 5')).toBeInTheDocument()
  })

  it('should drop the draft once the comment is posted', async () => {
    stubPost('Posted')
    const user = openSignedInThread()
    await typeComment(user, 'Posted')
    await user.click(screen.getByRole('button', { name: 'Post' }))
    await screen.findByText('Posted')
    screenCleanup()
    stubThread([comment])

    renderWithProviders(<ReviewComments reviewId={7} />)

    expect(await screen.findByRole('textbox', { name: 'Add a comment' })).toHaveValue('')
  })

  it('should ask before cancelling a written comment', async () => {
    const user = openSignedInThread()
    await typeComment(user, 'Half a thought')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(
      screen.getByRole('alertdialog', { name: 'Save your comment as a draft?' }),
    ).toBeInTheDocument()
  })

  it('should empty the comment box when the draft is discarded', async () => {
    const user = openSignedInThread()
    const box = await typeComment(user, 'Half a thought')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await user.click(screen.getByRole('button', { name: 'Discard' }))

    expect(box).toHaveValue('')
    expect(screen.queryByText(/^Draft saved/)).not.toBeInTheDocument()
  })

  it('should keep the comment when the save-draft prompt is cancelled', async () => {
    const user = openSignedInThread()
    const box = await typeComment(user, 'Half a thought')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    const prompt = screen.getByRole('alertdialog')

    await user.click(within(prompt).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(box).toHaveValue('Half a thought')
  })

  it('should mark the reply as a draft after saving it on cancel', async () => {
    const user = openSignedInThread()
    await user.click(await screen.findByRole('button', { name: 'Reply' }))
    await user.type(screen.getByRole('textbox', { name: 'Write a reply' }), 'Agreed')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await user.click(screen.getByRole('button', { name: 'Save draft' }))

    expect(screen.queryByRole('textbox', { name: 'Write a reply' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reply (draft)' })).toBeInTheDocument()
  })

  it('should ask about a written reply when its Reply button closes it', async () => {
    const user = openSignedInThread()
    await user.click(await screen.findByRole('button', { name: 'Reply' }))
    await user.type(screen.getByRole('textbox', { name: 'Write a reply' }), 'Agreed')

    await user.click(screen.getByRole('button', { name: 'Reply' }))

    expect(
      screen.getByRole('alertdialog', { name: 'Save your reply as a draft?' }),
    ).toBeInTheDocument()
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
    openSignedInThread()

    const posted = await screen.findByText('Comment 1')
    const box = screen.getByRole('textbox', { name: 'Add a comment' })
    expect(posted.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('should offer a log-in link to a signed-out reader', async () => {
    stubSignedOut()
    stubThread([])

    renderWithProviders(<ReviewComments reviewId={7} />)

    expect(await screen.findByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
  })
})
