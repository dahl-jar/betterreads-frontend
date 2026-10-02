import { delay, http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn, stubSignedOut } from '@/testing/authHandlers'
import review from '@/testing/mocks/review.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor, within } from '@/testing/test-utils'

import { BookReviews } from '../components/BookReviews'

const BASE = 'http://localhost:8080/api/v1'
const OWN_REVIEW_URL = `${BASE}/books/OL1W/reviews/me`
const LONG_BODY = 'The spice must flow. '.repeat(30).trim()
const OWN_REVIEW = { ...review, author: 'darrow' }
const OTHER_REVIEW = { ...review, id: 2, title: 'Another voice' }
const RATING_ONLY = { ...OWN_REVIEW, id: 9, rating: 4, title: null, body: null }
const SERVER_ERROR = 500

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

function stubFailure(method: 'put' | 'delete') {
  server.use(http[method](OWN_REVIEW_URL, () => new HttpResponse(null, { status: SERVER_ERROR })))
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('BookReviews', () => {
  it('should show a log-in prompt to rate when signed out', async () => {
    stubSignedOut()
    stubBookReviews([])

    renderWithProviders(<BookReviews bookKey="OL1W" />)

    expect(
      await screen.findByRole('link', { name: 'Log in to rate this book' }),
    ).toBeInTheDocument()
  })

  it('should list the existing reviews', async () => {
    stubSignedOut()
    stubBookReviews([review, { ...review, id: 2, title: 'Slow middle', body: 'Drags.' }])

    renderWithProviders(<BookReviews bookKey="OL1W" />)

    expect(await screen.findByText('A desert epic')).toBeInTheDocument()
    expect(screen.getByText('Slow middle')).toBeInTheDocument()
  })

  it('should name the author of a public review', async () => {
    stubSignedOut()
    stubBookReviews([review])

    renderWithProviders(<BookReviews bookKey="OL1W" />)

    expect(await screen.findByText('mustang')).toBeInTheDocument()
  })

  it('should render a review body as Markdown', async () => {
    stubSignedOut()
    stubBookReviews([{ ...review, body: 'A **bold** claim.' }])

    renderWithProviders(<BookReviews bookKey="OL1W" />)

    expect(await screen.findByRole('strong')).toHaveTextContent('bold')
  })

  it('should collapse only a body over 420 characters', async () => {
    stubSignedOut()
    stubBookReviews([
      { ...review, body: LONG_BODY },
      { ...review, id: 2, title: 'Slow middle', body: 'Drags.' },
    ])

    renderWithProviders(<BookReviews bookKey="OL1W" />)

    await screen.findByText('Slow middle')
    expect(screen.getAllByRole('button', { name: 'Show more' })).toHaveLength(1)
  })

  it('should offer to collapse an expanded body', async () => {
    stubSignedOut()
    stubBookReviews([{ ...review, body: LONG_BODY }])
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)

    await user.click(await screen.findByRole('button', { name: 'Show more' }))

    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show more' })).toBeNull()
  })

  it("should give each review's thread its comment count", async () => {
    stubSignedOut()
    stubBookReviews([
      { ...review, commentCount: 3 },
      { ...review, id: 2, commentCount: 0 },
    ])

    renderWithProviders(
      <BookReviews
        bookKey="OL1W"
        renderComments={(reviewId, commentCount) => (
          <p>{`thread ${reviewId} has ${commentCount}`}</p>
        )}
      />,
    )

    expect(await screen.findByText('thread 1 has 3')).toBeInTheDocument()
    expect(screen.getByText('thread 2 has 0')).toBeInTheDocument()
  })

  it('should report the total number of reviews', async () => {
    stubSignedOut()
    const onTotalChange = vi.fn()
    stubBookReviews([review], 37)

    renderWithProviders(<BookReviews bookKey="OL1W" onTotalChange={onTotalChange} />)

    await waitFor(() => expect(onTotalChange).toHaveBeenCalledWith(37))
  })

  it('should show the empty text for a book with no reviews', async () => {
    stubSignedOut()
    stubBookReviews([])

    renderWithProviders(<BookReviews bookKey="OL1W" />)

    expect(await screen.findByText('No reviews yet. Be the first to rate it.')).toBeInTheDocument()
  })

  it('should show an alert when the reviews cannot be loaded', async () => {
    stubSignedOut()
    server.use(
      http.get(
        `${BASE}/books/OL1W/reviews`,
        () => new HttpResponse(null, { status: SERVER_ERROR }),
      ),
    )

    renderWithProviders(<BookReviews bookKey="OL1W" />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load reviews. Try again later.',
    )
  })

  it('should save a selected rating', async () => {
    stubReader([])
    const sent = stubSave(RATING_ONLY)
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)

    await user.click(await screen.findByRole('button', { name: 'Rate 4 of 5' }))

    await waitFor(() => expect(sent).toEqual([{ rating: 4 }]))
  })

  it('should open the editor once a chosen rating is saved', async () => {
    stubReader([])
    stubSave(RATING_ONLY)
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)

    await user.click(await screen.findByRole('button', { name: 'Rate 4 of 5' }))

    expect(await screen.findByRole('textbox', { name: 'Review' })).toBeInTheDocument()
  })

  it('should keep the editor closed when the first rating fails', async () => {
    stubReader([])
    stubFailure('put')
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)

    await user.click(await screen.findByRole('button', { name: 'Rate 4 of 5' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save your review. Try again.',
    )
    expect(screen.queryByRole('textbox', { name: 'Review' })).toBeNull()
  })

  it('should open the editor from Write a review', async () => {
    stubReader([])
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)

    await user.click(await screen.findByRole('button', { name: 'Write a review' }))

    expect(screen.getByRole('textbox', { name: 'Review' })).toBeInTheDocument()
  })

  it('should save the edited text with the saved rating', async () => {
    stubReader([OWN_REVIEW])
    const sent = stubSave({ ...OWN_REVIEW, title: 'A desert epic, twice' })
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)
    await user.click(await screen.findByRole('button', { name: 'Edit review' }))
    await user.type(screen.getByLabelText('Title'), ', twice')

    await user.click(screen.getByRole('button', { name: 'Save review' }))

    expect(await screen.findByText('A desert epic, twice')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Review' })).toBeNull()
    expect(sent).toEqual([
      { rating: 5, title: 'A desert epic, twice', body: 'Spice and sandworms.' },
    ])
  })

  it('should preserve review text when the rating changes', async () => {
    stubReader([OWN_REVIEW])
    const sent = stubSave({ ...OWN_REVIEW, rating: 2 })
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)
    await user.click(await screen.findByRole('button', { name: 'Edit review' }))
    await user.type(screen.getByLabelText('Title'), ', twice')

    await user.click(screen.getByRole('button', { name: 'Rate 2 of 5' }))

    await waitFor(() =>
      expect(sent).toEqual([{ rating: 2, title: 'A desert epic', body: 'Spice and sandworms.' }]),
    )
  })

  it('should keep the editor draft when the rating changes', async () => {
    stubReader([OWN_REVIEW])
    stubSave({ ...OWN_REVIEW, rating: 2 })
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)
    await user.click(await screen.findByRole('button', { name: 'Edit review' }))
    await user.type(screen.getByLabelText('Title'), ', twice')

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

    renderWithProviders(<BookReviews bookKey="OL1W" />)

    await screen.findByText('Your review')
    const first = within(screen.getAllByRole('listitem')[0]!)
    expect(first.getByText('Your review')).toBeInTheDocument()
    expect(first.getByText('A desert epic')).toBeInTheDocument()
    expect(first.getByRole('button', { name: 'Edit review' })).toBeInTheDocument()
    expect(first.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
  })

  it("should not repeat the reader's own review in the public list", async () => {
    stubReader([OWN_REVIEW], [OTHER_REVIEW])

    renderWithProviders(<BookReviews bookKey="OL1W" />)

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
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)

    const star = await screen.findByRole('button', { name: 'Rate 3 of 5' })
    await user.click(star)

    expect(star).toBeDisabled()
    expect(sent).toEqual([])
  })

  it('should keep the review draft after saving fails', async () => {
    stubReader([OWN_REVIEW])
    stubFailure('put')
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)
    await user.click(await screen.findByRole('button', { name: 'Edit review' }))
    const title = screen.getByLabelText('Title')
    const body = screen.getByLabelText('Review')
    await user.clear(title)
    await user.type(title, 'Golden path')
    await user.clear(body)
    await user.type(body, 'The ending earned it.')

    await user.click(screen.getByRole('button', { name: 'Save review' }))
    await screen.findByRole('alert')

    expect(screen.getByLabelText('Title')).toHaveValue('Golden path')
    expect(screen.getByLabelText('Review')).toHaveValue('The ending earned it.')
    expect(screen.getByRole('button', { name: 'Save review' })).toBeInTheDocument()
  })

  it('should keep the existing review visible after removal fails', async () => {
    stubReader([OWN_REVIEW])
    stubFailure('delete')
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)

    await user.click(await screen.findByRole('button', { name: 'Remove' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not remove your review. Try again.',
    )
    expect(screen.getByRole('button', { name: 'Edit review' })).toBeInTheDocument()
    expect(screen.getAllByText('A desert epic')).toHaveLength(1)
  })
})
