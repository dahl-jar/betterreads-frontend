import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { ReviewComments } from '@/features/comments/components/ReviewComments'
import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { clearDrafts } from '@/lib/draftStore'
import { stubSignedIn, stubSignedOut } from '@/testing/authHandlers'
import recentReview from '@/testing/mocks/recent-review.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor, within } from '@/testing/test-utils'

import { RecentReviews } from '../components/RecentReviews'

const BASE = 'http://localhost:8080/api/v1'
const SECOND_REVIEW = { ...recentReview, id: 8, author: 'thirduser', title: 'Second take' }
const FINISHED_ONLY = { ...recentReview, readStartedAt: undefined }
const STARTED_ONLY = { ...recentReview, readFinishedAt: undefined }
const NOT_SHELVED = { ...recentReview, readStartedAt: undefined, readFinishedAt: undefined }
const TWO_PARAGRAPHS = { ...recentReview, body: 'First part.\n\nSecond part.' }

function stubRecent(reviews: Record<string, unknown>[]) {
  server.use(
    http.get(`${BASE}/reviews/recent`, () => HttpResponse.json({ data: reviews })),
    http.get(`${BASE}/reviews/:id/comments`, () =>
      HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } }),
    ),
  )
}

function renderRecent() {
  return renderWithProviders(
    <RecentReviews renderComments={(reviewId) => <ReviewComments reviewId={reviewId} />} />,
  )
}

async function openReviewBy(author: string) {
  const { user } = renderRecent()
  await user.click(
    await screen.findByRole('button', { name: `Read ${author}'s review of Golden Son` }),
  )
  return user
}

function openDialog() {
  return screen.getByRole('dialog', { name: 'Golden Son' })
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
  clearDrafts()
})

describe('RecentReviews', () => {
  it.each([
    { commentCount: 0, label: 'No comments yet' },
    { commentCount: 1, label: '1 comment' },
    { commentCount: 2, label: '2 comments' },
  ])('should show "$label" for $commentCount comments', async ({ commentCount, label }) => {
    stubSignedOut()
    stubRecent([{ ...recentReview, commentCount }])

    renderRecent()

    expect(await screen.findByText(label)).toBeInTheDocument()
  })

  it('should keep the book title as a link to the book', async () => {
    stubSignedOut()
    stubRecent([recentReview])

    renderRecent()

    expect(await screen.findByRole('link', { name: 'Golden Son' })).toHaveAttribute(
      'href',
      '/books/OL27W',
    )
  })

  it('should show only the opening paragraph in the list', async () => {
    stubSignedOut()
    stubRecent([TWO_PARAGRAPHS])

    renderRecent()

    expect(await screen.findByText('First part.')).toBeInTheDocument()
    expect(screen.queryByText('Second part.')).toBeNull()
  })

  it('should show the whole review in a window', async () => {
    stubSignedOut()
    stubRecent([TWO_PARAGRAPHS])

    await openReviewBy('otheruser')

    expect(within(openDialog()).getByText('Second part.')).toBeInTheDocument()
  })

  it('should show the posted and read dates in the review window', async () => {
    stubSignedOut()
    stubRecent([recentReview])

    await openReviewBy('otheruser')

    expect(within(openDialog()).getByText('Jun 1, 2026')).toBeInTheDocument()
    expect(within(openDialog()).getByText('Read from May 12 to May 28, 2026')).toBeInTheDocument()
  })

  it('should show the start year when reading crossed into a new year', async () => {
    stubSignedOut()
    stubRecent([{ ...recentReview, readStartedAt: '2025-12-20', readFinishedAt: '2026-01-05' }])

    await openReviewBy('otheruser')

    expect(
      within(openDialog()).getByText('Read from Dec 20, 2025 to Jan 5, 2026'),
    ).toBeInTheDocument()
  })

  it('should show only the finish date when the reviewer has no start date', async () => {
    stubSignedOut()
    stubRecent([FINISHED_ONLY])

    await openReviewBy('otheruser')

    expect(within(openDialog()).getByText('Finished May 28, 2026')).toBeInTheDocument()
  })

  it('should show only the start date for a reviewer still reading', async () => {
    stubSignedOut()
    stubRecent([STARTED_ONLY])

    await openReviewBy('otheruser')

    expect(within(openDialog()).getByText('Started May 12, 2026')).toBeInTheDocument()
  })

  it('should leave out read dates the reviewer never set', async () => {
    stubSignedOut()
    stubRecent([NOT_SHELVED])

    await openReviewBy('otheruser')

    const dialog = openDialog()
    expect(within(dialog).getByText('The gala chapter alone earns the stars.')).toBeInTheDocument()
    expect(within(dialog).queryByText(/^Read from|^Finished|^Started/)).toBeNull()
  })

  it('should show the next review', async () => {
    stubSignedOut()
    stubRecent([recentReview, SECOND_REVIEW])
    const user = await openReviewBy('otheruser')

    await user.click(screen.getByRole('button', { name: 'Next review' }))

    expect(screen.getByRole('heading', { name: 'Second take' })).toBeInTheDocument()
  })

  it('should disable Next on the last review', async () => {
    stubSignedOut()
    stubRecent([recentReview, SECOND_REVIEW])

    await openReviewBy('thirduser')

    expect(screen.getByRole('button', { name: 'Next review' })).toBeDisabled()
  })

  it('should show the previous review', async () => {
    stubSignedOut()
    stubRecent([recentReview, SECOND_REVIEW])
    const user = await openReviewBy('thirduser')

    await user.click(screen.getByRole('button', { name: 'Previous review' }))

    expect(screen.getByRole('heading', { name: 'Break the chains' })).toBeInTheDocument()
  })

  it('should close the window with Escape', async () => {
    stubSignedOut()
    stubRecent([recentReview])
    const user = await openReviewBy('otheruser')

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('should close the window from the backdrop', async () => {
    stubSignedOut()
    stubRecent([recentReview])
    const user = await openReviewBy('otheruser')
    const backdrop = openDialog().previousElementSibling

    await user.click(backdrop as Element)

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('should ask before closing over an unposted comment', async () => {
    stubSignedIn()
    stubRecent([recentReview])
    const user = await openReviewBy('otheruser')
    await user.type(await screen.findByRole('textbox', { name: 'Add a comment' }), 'Agreed')

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(
      screen.getByRole('alertdialog', { name: 'Save your comment as a draft?' }),
    ).toBeInTheDocument()
  })

  it('should ask before moving to the next review over an unposted comment', async () => {
    stubSignedIn()
    stubRecent([recentReview, SECOND_REVIEW])
    const user = await openReviewBy('otheruser')
    await user.type(await screen.findByRole('textbox', { name: 'Add a comment' }), 'Agreed')

    await user.click(screen.getByRole('button', { name: 'Next review' }))

    expect(
      screen.getByRole('alertdialog', { name: 'Save your comment as a draft?' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Break the chains' })).toBeInTheDocument()
  })

  it('should keep the window open when closing is cancelled', async () => {
    stubSignedIn()
    stubRecent([recentReview])
    const user = await openReviewBy('otheruser')
    await user.type(await screen.findByRole('textbox', { name: 'Add a comment' }), 'Agreed')
    await user.keyboard('{Escape}')

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(openDialog()).toBeInTheDocument()
  })
})
