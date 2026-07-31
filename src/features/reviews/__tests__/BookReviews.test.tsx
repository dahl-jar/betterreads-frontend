import { delay, http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn, stubSignedOut } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { BookReviews } from '../components/BookReviews'

import { makeReview } from './mocks/review'

const BASE = 'http://localhost:8080/api/v1'

beforeEach(() => {
  server.use(
    http.get(`${BASE}/books/:key/community-rating`, () =>
      HttpResponse.json({ data: { average: null, count: 0, distribution: [] } }),
    ),
  )
})

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('BookReviews', () => {
  it('should show a sign-in prompt to rate when signed out', async () => {
    stubSignedOut()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } }),
      ),
    )

    renderWithProviders(<BookReviews bookKey="OL1W" />)

    expect(await screen.findByRole('link', { name: /sign in to rate/i })).toBeInTheDocument()
  })

  it('should list the existing reviews', async () => {
    stubSignedOut()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({
          data: [makeReview(), makeReview({ id: 2, title: 'Slow middle', body: 'Drags.' })],
          meta: { total: 2, offset: 0, limit: 20 },
        }),
      ),
    )

    renderWithProviders(<BookReviews bookKey="OL1W" />)

    expect(await screen.findByText('A desert epic')).toBeInTheDocument()
    expect(screen.getByText('Slow middle')).toBeInTheDocument()
  })

  it('should save a selected rating', async () => {
    stubSignedIn()
    let sentBody: unknown
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } }),
      ),
      http.get(`${BASE}/me/reviews`, () =>
        HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 100 } }),
      ),
      http.put(`${BASE}/books/OL1W/reviews/me`, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json({
          data: makeReview({ id: 9, rating: 4, title: null, body: null }),
        })
      }),
    )
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)

    await user.click(await screen.findByRole('button', { name: 'Rate 4 of 5' }))

    await waitFor(() => expect(sentBody).toEqual({ rating: 4 }))
  })

  it('should preserve review text when the rating changes', async () => {
    stubSignedIn()
    let sentBody: unknown
    const existing = makeReview({ id: 9, rating: 5, title: 'A desert epic', body: 'Spice.' })
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({ data: [existing], meta: { total: 1, offset: 0, limit: 20 } }),
      ),
      http.get(`${BASE}/me/reviews`, () =>
        HttpResponse.json({ data: [existing], meta: { total: 1, offset: 0, limit: 100 } }),
      ),
      http.put(`${BASE}/books/OL1W/reviews/me`, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json({ data: makeReview({ ...existing, rating: 2 }) })
      }),
    )
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)

    await screen.findByText('A desert epic')
    await user.click(await screen.findByRole('button', { name: 'Rate 2 of 5' }))

    await waitFor(() =>
      expect(sentBody).toEqual({ rating: 2, title: 'A desert epic', body: 'Spice.' }),
    )
  })

  it("should show the reader's review editor", async () => {
    stubSignedIn()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({ data: [makeReview()], meta: { total: 1, offset: 0, limit: 20 } }),
      ),
      http.get(`${BASE}/me/reviews`, () =>
        HttpResponse.json({ data: [makeReview()], meta: { total: 1, offset: 0, limit: 100 } }),
      ),
    )

    renderWithProviders(<BookReviews bookKey="OL1W" />)

    expect(await screen.findByText('Your review')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /edit review/i })).toBeInTheDocument()
  })

  it("should not repeat the reader's own review in the public list", async () => {
    stubSignedIn()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({
          data: [makeReview(), makeReview({ id: 2, title: 'Another voice' })],
          meta: { total: 2, offset: 0, limit: 20 },
        }),
      ),
      http.get(`${BASE}/me/reviews`, () =>
        HttpResponse.json({ data: [makeReview()], meta: { total: 1, offset: 0, limit: 100 } }),
      ),
    )

    renderWithProviders(<BookReviews bookKey="OL1W" />)

    expect(await screen.findByText('Another voice')).toBeInTheDocument()
    expect(screen.getAllByText('A desert epic')).toHaveLength(1)
  })

  it('should block rating changes until ownership loads', async () => {
    stubSignedIn()
    let putCalled = false
    const existing = makeReview({ id: 9, rating: 5, title: 'A desert epic', body: 'Spice.' })
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({ data: [existing], meta: { total: 1, offset: 0, limit: 20 } }),
      ),
      http.get(`${BASE}/me/reviews`, async () => {
        await delay('infinite')
        return HttpResponse.json({
          data: [existing],
          meta: { total: 1, offset: 0, limit: 100 },
        })
      }),
      http.put(`${BASE}/books/OL1W/reviews/me`, () => {
        putCalled = true
        return HttpResponse.json({ data: existing })
      }),
    )
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)

    const star = await screen.findByRole('button', { name: 'Rate 3 of 5' })
    await user.click(star)

    expect(star).toBeDisabled()
    expect(putCalled).toBe(false)
  })

  it('should keep the review draft after saving fails', async () => {
    stubSignedIn()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({ data: [makeReview()], meta: { total: 1, offset: 0, limit: 20 } }),
      ),
      http.get(`${BASE}/me/reviews`, () =>
        HttpResponse.json({ data: [makeReview()], meta: { total: 1, offset: 0, limit: 100 } }),
      ),
      http.put(`${BASE}/books/OL1W/reviews/me`, () => new HttpResponse(null, { status: 500 })),
    )
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)
    await user.click(await screen.findByRole('button', { name: /edit review/i }))
    const title = screen.getByLabelText('Title')
    const body = screen.getByLabelText('Review')
    await user.clear(title)
    await user.type(title, 'Golden path')
    await user.clear(body)
    await user.type(body, 'The ending earned it.')

    await user.click(screen.getByRole('button', { name: /save review/i }))
    await screen.findByRole('alert')

    expect(screen.getByLabelText('Title')).toHaveValue('Golden path')
    expect(screen.getByLabelText('Review')).toHaveValue('The ending earned it.')
    expect(screen.getByRole('button', { name: /save review/i })).toBeInTheDocument()
  })

  it('should keep the existing review visible after removal fails', async () => {
    stubSignedIn()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({ data: [makeReview()], meta: { total: 1, offset: 0, limit: 20 } }),
      ),
      http.get(`${BASE}/me/reviews`, () =>
        HttpResponse.json({ data: [makeReview()], meta: { total: 1, offset: 0, limit: 100 } }),
      ),
      http.delete(`${BASE}/books/OL1W/reviews/me`, () => new HttpResponse(null, { status: 500 })),
    )
    const { user } = renderWithProviders(<BookReviews bookKey="OL1W" />)

    await user.click(await screen.findByRole('button', { name: /^remove$/i }))
    await screen.findByRole('alert')

    expect(screen.getByRole('button', { name: /edit review/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^remove$/i })).toBeInTheDocument()
    expect(screen.getAllByText('A desert epic')).toHaveLength(1)
  })
})
