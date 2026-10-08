import { delay, http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { clearDrafts, readDraft, writeDraft } from '@/lib/draftStore'
import { stubSignedIn, stubSignedOut } from '@/testing/authHandlers'
import draft from '@/testing/mocks/draft.json'
import review from '@/testing/mocks/review.json'
import book from '@/testing/mocks/reviewed-book.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor, within } from '@/testing/test-utils'

import { BookReviews } from '../components/BookReviews'

const BASE = 'http://localhost:8080/api/v1'
const OWN_REVIEW_URL = `${BASE}/books/OL1W/reviews/me`
const LONG_BODY = 'x'.repeat(421)
const LONGEST_SHORT_BODY = 'y'.repeat(420)
const OWN_REVIEW = { ...review, author: 'user' }
const OTHER_REVIEW = { ...review, id: 2, title: 'Another voice' }
const SHORT_REVIEW = { ...review, id: 2, title: 'Slow middle', body: 'Drags.' }
const RATING_ONLY = { ...OWN_REVIEW, id: 9, rating: 4, title: null, body: null }
const SERVER_ERROR = 500
const REVIEW_DRAFT = { ...draft, title: 'Unfinished', body: 'Halfway through the ending.' }

function stubBookReviews(reviews: Record<string, unknown>[], total = reviews.length) {
  server.use(
    http.get(`${BASE}/books/OL1W/reviews`, () =>
      HttpResponse.json({ data: reviews, meta: { total, offset: 0, limit: 20 } }),
    ),
  )
}

function stubOwnReviews(reviews: Record<string, unknown>[]) {
  server.use(
    http.get(`${BASE}/me/reviews`, () =>
      HttpResponse.json({ data: reviews, meta: { total: reviews.length, offset: 0, limit: 100 } }),
    ),
  )
}

function stubReader(own: Record<string, unknown>[], others: Record<string, unknown>[] = []) {
  stubSignedIn()
  stubBookReviews([...others, ...own])
  stubOwnReviews(own)
}

function stubSave(saved: Record<string, unknown>) {
  const sent: unknown[] = []
  server.use(
    http.put(OWN_REVIEW_URL, async ({ request }) => {
      sent.push(await request.json())
      return HttpResponse.json({ data: saved })
    }),
  )
  return sent
}

async function editOwnReview(saved: Record<string, unknown>) {
  stubReader([OWN_REVIEW])
  const sent = stubSave(saved)
  const { user } = renderWithProviders(<BookReviews book={book} />)
  await user.click(await screen.findByRole('button', { name: 'Edit review' }))
  await user.type(screen.getByLabelText('Title'), ', twice')
  return { user, sent }
}

function stubFailure(method: 'put' | 'delete') {
  server.use(http[method](OWN_REVIEW_URL, () => new HttpResponse(null, { status: SERVER_ERROR })))
}

async function failingEdit() {
  stubReader([OWN_REVIEW])
  stubFailure('put')
  const { user } = renderWithProviders(<BookReviews book={book} />)
  await user.click(await screen.findByRole('button', { name: 'Edit review' }))
  return user
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
  clearDrafts()
})

describe('BookReviews', () => {
  it('should show a log-in prompt to rate when signed out', async () => {
    stubSignedOut()
    stubBookReviews([])

    renderWithProviders(<BookReviews book={book} />)

    expect(
      await screen.findByRole('link', { name: 'Log in to rate this book' }),
    ).toBeInTheDocument()
  })

  it('should list the existing reviews', async () => {
    stubSignedOut()
    stubBookReviews([review, SHORT_REVIEW])

    renderWithProviders(<BookReviews book={book} />)

    expect(await screen.findByText('A desert epic')).toBeInTheDocument()
    expect(screen.getByText('Slow middle')).toBeInTheDocument()
  })

  it('should name the author of a public review', async () => {
    stubSignedOut()
    stubBookReviews([review])

    renderWithProviders(<BookReviews book={book} />)

    expect(await screen.findByText('otheruser')).toBeInTheDocument()
  })

  it('should render a review body as Markdown', async () => {
    stubSignedOut()
    stubBookReviews([{ ...review, body: 'A **bold** claim.' }])

    renderWithProviders(<BookReviews book={book} />)

    expect(await screen.findByRole('strong')).toHaveTextContent('bold')
  })

  it('should offer the full review only for a body over 420 characters', async () => {
    stubSignedOut()
    stubBookReviews([
      { ...review, body: LONG_BODY },
      { ...SHORT_REVIEW, body: LONGEST_SHORT_BODY },
    ])

    renderWithProviders(<BookReviews book={book} />)

    await screen.findByText('Slow middle')
    expect(screen.getAllByRole('button', { name: 'Read full review' })).toHaveLength(1)
  })

  it('should open a long review in a window with its whole text', async () => {
    stubSignedOut()
    stubBookReviews([{ ...review, body: LONG_BODY }])
    const { user } = renderWithProviders(<BookReviews book={book} />)

    await user.click(await screen.findByRole('button', { name: 'Read full review' }))

    const dialog = screen.getByRole('dialog', { name: 'Dune' })
    expect(within(dialog).getByText(LONG_BODY)).toBeInTheDocument()
  })

  it('should label the comment button of an uncommented review Comment', async () => {
    stubSignedOut()
    stubBookReviews([{ ...review, commentCount: 0 }])

    renderWithProviders(<BookReviews book={book} />)

    expect(await screen.findByRole('button', { name: 'Comment' })).toBeInTheDocument()
  })

  it('should close another review without asking about the review being edited', async () => {
    stubReader([OWN_REVIEW], [OTHER_REVIEW])
    const { user } = renderWithProviders(<BookReviews book={book} />)
    await user.click(await screen.findByRole('button', { name: 'Edit review' }))
    await user.type(screen.getByLabelText('Title'), ', twice')
    await user.click(screen.getByRole('button', { name: '3 comments' }))

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(readDraft('user', 'review:OL1W')?.title).toBe('A desert epic, twice')
  })

  it('should open the comments of a review in the window from its comment count', async () => {
    stubSignedOut()
    stubBookReviews([
      { ...review, commentCount: 3 },
      { ...review, id: 2, commentCount: 0 },
    ])
    const { user } = renderWithProviders(
      <BookReviews book={book} renderComments={(reviewId) => <p>{`thread ${reviewId}`}</p>} />,
    )

    await user.click(await screen.findByRole('button', { name: '3 comments' }))

    const dialog = screen.getByRole('dialog', { name: 'Dune' })
    expect(within(dialog).getByText('thread 1')).toBeInTheDocument()
    expect(screen.queryByText('thread 2')).toBeNull()
  })

  it('should report the total number of reviews', async () => {
    stubSignedOut()
    const onTotalChange = vi.fn()
    stubBookReviews([review], 37)

    renderWithProviders(<BookReviews book={book} onTotalChange={onTotalChange} />)

    await waitFor(() => expect(onTotalChange).toHaveBeenCalledWith(37))
  })

  it('should show the empty text for a book with no reviews', async () => {
    stubSignedOut()
    stubBookReviews([])

    renderWithProviders(<BookReviews book={book} />)

    expect(await screen.findByText('No written reviews yet.')).toBeInTheDocument()
  })

  it('should show an alert when the reviews cannot be loaded', async () => {
    stubSignedOut()
    server.use(
      http.get(
        `${BASE}/books/OL1W/reviews`,
        () => new HttpResponse(null, { status: SERVER_ERROR }),
      ),
    )

    renderWithProviders(<BookReviews book={book} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load reviews. Try again later.',
    )
  })

  it('should save a selected rating', async () => {
    stubReader([])
    const sent = stubSave(RATING_ONLY)
    const { user } = renderWithProviders(<BookReviews book={book} />)

    await user.click(await screen.findByRole('button', { name: 'Rate 4 of 5' }))

    await waitFor(() => expect(sent).toEqual([{ rating: 4 }]))
  })

  it('should open the editor once a chosen rating is saved', async () => {
    stubReader([])
    stubSave(RATING_ONLY)
    const { user } = renderWithProviders(<BookReviews book={book} />)

    await user.click(await screen.findByRole('button', { name: 'Rate 4 of 5' }))

    expect(await screen.findByRole('textbox', { name: 'Review' })).toBeInTheDocument()
  })

  it('should keep the editor closed when the first rating fails', async () => {
    stubReader([])
    stubFailure('put')
    const { user } = renderWithProviders(<BookReviews book={book} />)

    await user.click(await screen.findByRole('button', { name: 'Rate 4 of 5' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save your review. Try again.',
    )
    expect(screen.queryByRole('textbox', { name: 'Review' })).toBeNull()
  })

  it('should open the editor from Write a review', async () => {
    stubReader([])
    const { user } = renderWithProviders(<BookReviews book={book} />)

    await user.click(await screen.findByRole('button', { name: 'Write a review' }))

    expect(screen.getByRole('textbox', { name: 'Review' })).toBeInTheDocument()
  })

  it('should save the edited text with the saved rating', async () => {
    const { user, sent } = await editOwnReview({ ...OWN_REVIEW, title: 'A desert epic, twice' })

    await user.click(screen.getByRole('button', { name: 'Save review' }))

    expect(await screen.findByText('A desert epic, twice')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Review' })).toBeNull()
    expect(sent).toEqual([
      { rating: 5, title: 'A desert epic, twice', body: 'Spice and sandworms.' },
    ])
  })

  it('should preserve review text when the rating changes', async () => {
    const { user, sent } = await editOwnReview({ ...OWN_REVIEW, rating: 2 })

    await user.click(screen.getByRole('button', { name: 'Rate 2 of 5' }))

    await waitFor(() =>
      expect(sent).toEqual([{ rating: 2, title: 'A desert epic', body: 'Spice and sandworms.' }]),
    )
  })

  it('should keep the editor draft when the rating changes', async () => {
    const { user } = await editOwnReview({ ...OWN_REVIEW, rating: 2 })

    await user.click(screen.getByRole('button', { name: 'Rate 2 of 5' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Rate 3 of 5' })).toHaveAttribute(
        'aria-pressed',
        'false',
      ),
    )
    expect(screen.getByLabelText('Title')).toHaveValue('A desert epic, twice')
  })

  it("should list the reader's own review first", async () => {
    stubReader([OWN_REVIEW], [OTHER_REVIEW])

    renderWithProviders(<BookReviews book={book} />)

    await screen.findByText('Your review')
    const first = within(screen.getAllByRole('listitem')[0]!)
    expect(first.getByText('Your review')).toBeInTheDocument()
    expect(first.getByText('A desert epic')).toBeInTheDocument()
    expect(first.getByRole('button', { name: 'Edit review' })).toBeInTheDocument()
    expect(first.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
  })

  it("should not repeat the reader's own review in the public list", async () => {
    stubReader([OWN_REVIEW], [OTHER_REVIEW])

    renderWithProviders(<BookReviews book={book} />)

    expect(await screen.findByText('Another voice')).toBeInTheDocument()
    expect(screen.getAllByText('A desert epic')).toHaveLength(1)
  })

  it('should block rating changes until ownership loads', async () => {
    stubSignedIn()
    stubBookReviews([OWN_REVIEW])
    server.use(
      http.get(`${BASE}/me/reviews`, async () => {
        await delay('infinite')
        return HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 100 } })
      }),
    )
    const sent = stubSave(OWN_REVIEW)
    const { user } = renderWithProviders(<BookReviews book={book} />)

    const star = await screen.findByRole('button', { name: 'Rate 3 of 5' })
    await user.click(star)

    expect(star).toBeDisabled()
    expect(sent).toEqual([])
  })

  it('should keep the review text as a draft when saving fails', async () => {
    const user = await failingEdit()
    const title = screen.getByLabelText('Title')
    const body = screen.getByLabelText('Review')
    await user.clear(title)
    await user.type(title, 'Golden path')
    await user.clear(body)
    await user.type(body, 'The ending earned it.')

    await user.click(screen.getByRole('button', { name: 'Save review' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save your review. Your text is saved as a draft. Try again.',
    )
    expect(screen.getByLabelText('Title')).toHaveValue('Golden path')
    expect(screen.getByLabelText('Review')).toHaveValue('The ending earned it.')
    expect(readDraft('user', 'review:OL1W')).toMatchObject({
      title: 'Golden path',
      body: 'The ending earned it.',
    })
  })

  it('should open the editor with the saved draft over the saved review', async () => {
    stubReader([OWN_REVIEW])
    writeDraft('user', 'review:OL1W', REVIEW_DRAFT)
    const { user } = renderWithProviders(<BookReviews book={book} />)
    await screen.findByRole('button', { name: 'Edit review' })

    await user.click(screen.getByRole('button', { name: 'Continue writing' }))

    expect(screen.getByLabelText('Title')).toHaveValue('Unfinished')
    expect(screen.getByLabelText('Review')).toHaveValue('Halfway through the ending.')
  })

  it('should drop an unfinished review when it is discarded', async () => {
    stubReader([])
    writeDraft('user', 'review:OL1W', REVIEW_DRAFT)
    const { user } = renderWithProviders(<BookReviews book={book} />)

    await user.click(await screen.findByRole('button', { name: 'Discard' }))

    expect(screen.queryByText('You have an unfinished review')).toBeNull()
    expect(readDraft('user', 'review:OL1W')).toBeUndefined()
  })

  it('should ask before cancelling a changed review', async () => {
    const { user } = await editOwnReview(OWN_REVIEW)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(
      screen.getByRole('alertdialog', { name: 'Save your review as a draft?' }),
    ).toBeInTheDocument()
  })

  it('should show the unfinished review after its draft is saved on cancel', async () => {
    const { user } = await editOwnReview(OWN_REVIEW)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await user.click(screen.getByRole('button', { name: 'Save draft' }))

    expect(screen.queryByRole('textbox', { name: 'Review' })).toBeNull()
    expect(screen.getByText('You have an unfinished review')).toBeInTheDocument()
  })

  it('should drop the draft once the review is saved', async () => {
    const { user } = await editOwnReview({ ...OWN_REVIEW, title: 'A desert epic, twice' })

    await user.click(screen.getByRole('button', { name: 'Save review' }))

    await screen.findByText('A desert epic, twice')
    expect(readDraft('user', 'review:OL1W')).toBeUndefined()
  })

  it('should keep the existing review visible after removal fails', async () => {
    stubReader([OWN_REVIEW])
    stubFailure('delete')
    const { user } = renderWithProviders(<BookReviews book={book} />)

    await user.click(await screen.findByRole('button', { name: 'Remove' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not remove your review. Try again.',
    )
    expect(screen.getByRole('button', { name: 'Edit review' })).toBeInTheDocument()
    expect(screen.getAllByText('A desert epic')).toHaveLength(1)
  })
})
