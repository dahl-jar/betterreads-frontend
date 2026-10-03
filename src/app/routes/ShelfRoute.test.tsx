import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn } from '@/testing/authHandlers'
import review from '@/testing/mocks/review.json'
import shelfEntry from '@/testing/mocks/shelf-entry.json'
import { server } from '@/testing/msw-server'
import { RED_RISING } from '@/testing/readingHistory'
import { renderWithProviders, screen, waitFor, within } from '@/testing/test-utils'

import { ShelfRoute } from './ShelfRoute'

const SHELF_URL = 'http://localhost:8080/api/v1/me/books'
const REVIEW_URL = `http://localhost:8080/api/v1/books/${shelfEntry.key}/reviews/me`
const FAVORITE = { ...RED_RISING, favorite: true }

beforeEach(() => {
  stubSignedIn()
  server.use(http.get(SHELF_URL, () => HttpResponse.json({ data: [shelfEntry, FAVORITE] })))
})

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

function rail() {
  return within(screen.getByRole('navigation', { name: 'Shelves' }))
}

describe('ShelfRoute', () => {
  it('should save only the rating when a row is rated', async () => {
    let sentBody: unknown
    let reviewReplaced = false
    server.use(
      http.get(SHELF_URL, () => HttpResponse.json({ data: [shelfEntry] })),
      http.put(`${REVIEW_URL}/rating`, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json({ data: { ...review, bookKey: shelfEntry.key, rating: 4 } })
      }),
      http.put(REVIEW_URL, () => {
        reviewReplaced = true
        return HttpResponse.json({ data: review })
      }),
    )
    const { user } = renderWithProviders(<ShelfRoute />, { route: '/shelf' })
    await screen.findByRole('link', { name: shelfEntry.title })

    await user.click(screen.getByRole('button', { name: 'Rate 4 of 5' }))

    await waitFor(() => expect(sentBody).toEqual({ rating: 4 }))
    expect(reviewReplaced).toBe(false)
  })

  it('should open the shelf named in the address', async () => {
    renderWithProviders(<ShelfRoute />, { route: '/shelf?shelf=FAVORITES' })

    await screen.findByRole('link', { name: FAVORITE.title })

    expect(screen.queryByRole('link', { name: shelfEntry.title })).toBeNull()
    expect(rail().getByRole('button', { name: /^Favorites\b/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('should open all books when the address names an unknown shelf', async () => {
    renderWithProviders(<ShelfRoute />, { route: '/shelf?shelf=bogus' })

    await screen.findByRole('link', { name: FAVORITE.title })

    expect(rail().getByRole('button', { name: /^All books\b/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
