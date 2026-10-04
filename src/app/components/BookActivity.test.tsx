import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import comment from '@/features/comments/__tests__/mocks/comment.json'
import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedOut } from '@/testing/authHandlers'
import { emptyPage } from '@/testing/emptyPage'
import review from '@/testing/mocks/review.json'
import book from '@/testing/mocks/reviewed-book.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, within } from '@/testing/test-utils'

import { BookActivity } from './BookActivity'

const BASE = 'http://localhost:8080/api/v1'

function stubEmptyActivity() {
  stubSignedOut()
  server.use(
    http.get(`${BASE}/books/OL1W/reviews`, emptyPage),
    http.get(`${BASE}/books/OL1W/comments`, emptyPage),
  )
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('BookActivity', () => {
  it('should show reviews first', async () => {
    stubEmptyActivity()

    renderWithProviders(<BookActivity book={book} />)

    expect(await screen.findByRole('heading', { name: /ratings & reviews/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /discussion/i })).toBeNull()
  })

  it('should show the discussion tab', async () => {
    stubEmptyActivity()
    const { user } = renderWithProviders(<BookActivity book={book} />)

    await user.click(await screen.findByRole('tab', { name: 'Discussions' }))

    expect(await screen.findByRole('heading', { name: /discussion/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /ratings & reviews/i })).toBeNull()
  })

  it('should open the review thread in the window from the comment count', async () => {
    stubEmptyActivity()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({
          data: [{ ...review, commentCount: 1 }],
          meta: { total: 1, offset: 0, limit: 20 },
        }),
      ),
      http.get(`${BASE}/reviews/1/comments`, () =>
        HttpResponse.json({
          data: [{ ...comment, body: 'The sandworms carry it.' }],
          meta: { total: 1, offset: 0, limit: 20 },
        }),
      ),
    )
    const { user } = renderWithProviders(<BookActivity book={book} />)

    await user.click(await screen.findByRole('button', { name: '1 comment' }))

    const dialog = screen.getByRole('dialog', { name: 'Dune' })
    expect(await within(dialog).findByText('The sandworms carry it.')).toBeInTheDocument()
  })
})
