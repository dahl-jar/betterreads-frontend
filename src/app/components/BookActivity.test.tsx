import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedOut as stubAnonymousSession } from '@/testing/authHandlers'
import review from '@/testing/mocks/review.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen } from '@/testing/test-utils'

import { BookActivity } from './BookActivity'

const BASE = 'http://localhost:8080/api/v1'

function stubSignedOut() {
  stubAnonymousSession()
  server.use(
    http.get(`${BASE}/books/OL1W/reviews`, () =>
      HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } }),
    ),
    http.get(`${BASE}/books/OL1W/comments`, () =>
      HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } }),
    ),
  )
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('BookActivity', () => {
  it('should show reviews first', async () => {
    stubSignedOut()

    renderWithProviders(<BookActivity bookKey="OL1W" />)

    expect(await screen.findByRole('heading', { name: /ratings & reviews/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /discussion/i })).toBeNull()
  })

  it('should show the discussion tab', async () => {
    stubSignedOut()
    const { user } = renderWithProviders(<BookActivity bookKey="OL1W" />)

    await user.click(await screen.findByRole('tab', { name: 'Discussions' }))

    expect(await screen.findByRole('heading', { name: /discussion/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /ratings & reviews/i })).toBeNull()
  })

  it("should label a review's comment toggle with its comment count", async () => {
    stubSignedOut()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({
          data: [{ ...review, commentCount: 3 }],
          meta: { total: 1, offset: 0, limit: 20 },
        }),
      ),
    )

    renderWithProviders(<BookActivity bookKey="OL1W" />)

    expect(await screen.findByRole('button', { name: '3 comments' })).toBeInTheDocument()
  })
})
