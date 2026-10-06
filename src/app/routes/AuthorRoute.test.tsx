import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { stubSignedOut } from '@/testing/authHandlers'
import { CurrentLocation } from '@/testing/CurrentLocation'
import authorPage from '@/testing/mocks/author-page.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen } from '@/testing/test-utils'

import { AuthorRoute } from './AuthorRoute'

const API_URL = 'http://localhost:8080/api/v1/authors'

function renderAuthor(route: string) {
  stubSignedOut()
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/authors/:id" element={<AuthorRoute />} />
      </Routes>
      <CurrentLocation />
    </>,
    { route },
  )
}

describe('AuthorRoute', () => {
  it('should replace the url for a merged author', async () => {
    server.use(http.get(`${API_URL}/412`, () => HttpResponse.json({ data: authorPage })))

    renderAuthor('/authors/412')

    expect(await screen.findByText('/authors/87')).toBeInTheDocument()
  })

  it('should list the books', async () => {
    server.use(http.get(`${API_URL}/87`, () => HttpResponse.json({ data: authorPage })))

    renderAuthor('/authors/87')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Brandon Sanderson' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /The Way of Kings/ })).toHaveAttribute(
      'href',
      '/books/9780765326355',
    )
    expect(screen.getByRole('link', { name: /Elantris/ })).toBeInTheDocument()
  })
})
