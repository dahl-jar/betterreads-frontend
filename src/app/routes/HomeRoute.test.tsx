import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedOut } from '@/testing/authHandlers'
import { CurrentLocation } from '@/testing/CurrentLocation'
import catalogCard from '@/testing/mocks/catalog-card.json'
import recentReview from '@/testing/mocks/recent-review.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor, within } from '@/testing/test-utils'

import { HomeRoute } from './HomeRoute'

const BASE = 'http://localhost:8080/api/v1'

const LIST_CARDS: Record<string, typeof catalogCard> = {
  TOP_RATED: { ...catalogCard, key: 'top-1', title: 'Top Book' },
  RECENTLY_ADDED: { ...catalogCard, key: 'new-1', title: 'New Book', firstPublishYear: 1965 },
}

type RecentReviewsReply = () => Response

function stubHome(recentReviews: RecentReviewsReply, { listsWaitForReviews = false } = {}) {
  const listRequests: string[] = []
  const recentLimits: (string | null)[] = []
  let markReviewsAnswered: () => void = () => undefined
  const reviewsAnswered = listsWaitForReviews
    ? new Promise<void>((resolve) => {
        markReviewsAnswered = resolve
      })
    : Promise.resolve()
  stubSignedOut()
  server.use(
    http.get(`${BASE}/books/count`, () => HttpResponse.json({ data: { total: 12_345 } })),
    http.get(`${BASE}/books`, async ({ request }) => {
      const params = new URL(request.url).searchParams
      const list = params.get('list') ?? ''
      listRequests.push(`${list} ${params.get('limit')}`)
      await reviewsAnswered
      return HttpResponse.json({ data: [LIST_CARDS[list]] })
    }),
    http.get(`${BASE}/reviews/recent`, ({ request }) => {
      recentLimits.push(new URL(request.url).searchParams.get('limit'))
      markReviewsAnswered()
      return recentReviews()
    }),
  )
  return { listRequests, recentLimits }
}

const noReviews: RecentReviewsReply = () => HttpResponse.json({ data: [] })
const oneReview: RecentReviewsReply = () => HttpResponse.json({ data: [recentReview] })
const failedReviews: RecentReviewsReply = () => new HttpResponse(null, { status: 500 })

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('HomeRoute', () => {
  it('should show each list under its own heading', async () => {
    const { listRequests } = stubHome(noReviews)

    renderWithProviders(<HomeRoute />)

    const topRated = await screen.findByRole('region', { name: 'Top rated' })
    const recentlyAdded = screen.getByRole('region', { name: 'Recently added' })
    expect(await within(topRated).findByRole('link', { name: /Top Book/ })).toBeInTheDocument()
    expect(await within(recentlyAdded).findByRole('link', { name: /New Book/ })).toBeInTheDocument()
    expect([...listRequests].sort()).toEqual(['RECENTLY_ADDED 20', 'TOP_RATED 20'])
  })

  it('should rank the top rated books', async () => {
    stubHome(noReviews)

    renderWithProviders(<HomeRoute />)

    const topRated = await screen.findByRole('region', { name: 'Top rated' })
    expect(await within(topRated).findByText('No. 1')).toBeInTheDocument()
  })

  it('should date the recently added books', async () => {
    stubHome(noReviews)

    renderWithProviders(<HomeRoute />)

    const recentlyAdded = await screen.findByRole('region', { name: 'Recently added' })
    expect(await within(recentlyAdded).findByText('1965')).toBeInTheDocument()
  })

  it('should feature the newest book', async () => {
    stubHome(noReviews)

    renderWithProviders(<HomeRoute />)

    const featured = await screen.findByRole('link', { name: /New in the catalog/ })
    expect(featured).toHaveAttribute('href', '/books/new-1')
  })

  it('should go to the search page with the submitted query', async () => {
    stubHome(noReviews)
    const { user } = renderWithProviders(
      <>
        <HomeRoute />
        <CurrentLocation />
      </>,
    )

    await user.type(screen.getByRole('searchbox'), 'wheel of time')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(screen.getByText('/search?q=wheel+of+time')).toBeInTheDocument()
  })

  it('should show each recent review with its reviewer and book', async () => {
    const { recentLimits } = stubHome(oneReview)

    renderWithProviders(<HomeRoute />)

    expect(await screen.findByRole('heading', { name: 'Recent reviews' })).toBeInTheDocument()
    expect(screen.getByText('mustang')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Golden Son' })).toHaveAttribute('href', '/books/OL27W')
    expect(recentLimits).toEqual(['6'])
  })

  it.each([
    { reviews: 'are empty', recentReviews: noReviews },
    { reviews: 'fail to load', recentReviews: failedReviews },
  ])(
    'should show no Recent reviews heading when the reviews $reviews',
    async ({ recentReviews }) => {
      const { recentLimits } = stubHome(recentReviews, { listsWaitForReviews: true })

      renderWithProviders(<HomeRoute />)

      await waitFor(() => expect(recentLimits).toEqual(['6']))
      await screen.findAllByRole('link', { name: /Top Book/ })
      expect(screen.queryByRole('heading', { name: 'Recent reviews' })).toBeNull()
    },
  )
})
