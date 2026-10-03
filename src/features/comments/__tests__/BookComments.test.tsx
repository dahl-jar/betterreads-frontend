import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn, stubSignedOut } from '@/testing/authHandlers'
import { emptyPage } from '@/testing/emptyPage'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen } from '@/testing/test-utils'

import { BookComments } from '../components/BookComments'

import comment from './mocks/comment.json'

const BASE = 'http://localhost:8080/api/v1'

function stubNoComments() {
  server.use(http.get(`${BASE}/books/OL1W/comments`, emptyPage))
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('BookComments', () => {
  it('should load the book discussion', async () => {
    stubSignedOut()
    let path = ''
    server.use(
      http.get(`${BASE}/books/OL1W/comments`, ({ request }) => {
        path = new URL(request.url).pathname
        return HttpResponse.json({
          data: [{ ...comment, body: 'Great read' }],
          meta: { total: 1, offset: 0, limit: 20 },
        })
      }),
    )

    renderWithProviders(<BookComments bookKey="OL1W" />)

    expect(await screen.findByRole('heading', { name: /discussion/i })).toBeInTheDocument()
    expect(await screen.findByText('Great read')).toBeInTheDocument()
    expect(path).toBe('/api/v1/books/OL1W/comments')
  })

  it('should give the comment textarea an accessible name', async () => {
    stubSignedIn()
    stubNoComments()

    renderWithProviders(<BookComments bookKey="OL1W" />)

    expect(await screen.findByRole('textbox', { name: /add a comment/i })).toBeInTheDocument()
  })

  it('should show an empty-discussion prompt when there are no comments', async () => {
    stubSignedOut()
    stubNoComments()

    renderWithProviders(<BookComments bookKey="OL1W" />)

    expect(await screen.findByText(/no comments yet/i)).toBeInTheDocument()
  })
})
