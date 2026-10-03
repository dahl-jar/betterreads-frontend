import { render, screen, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { AuthProvider } from '@/app/components/AuthProvider'
import { clearAccessToken } from '@/lib/api/token'
import auth from '@/testing/mocks/auth.json'
import book from '@/testing/mocks/book.json'
import myShelfCounts from '@/testing/mocks/my-shelf-counts.json'
import noCommunityRating from '@/testing/mocks/no-community-rating.json'
import { server } from '@/testing/msw-server'

import { routes } from './router'

const BASE = 'http://localhost:8080/api/v1/auth'

afterEach(() => {
  clearAccessToken()
  document.title = ''
})

function renderAt(path: string, authenticated = false) {
  server.use(
    authenticated
      ? http.post(`${BASE}/refresh`, () =>
          HttpResponse.json({ data: { ...auth, accessToken: 'jwt' } }),
        )
      : http.post(`${BASE}/refresh`, () => new HttpResponse(null, { status: 401 })),
    http.get('http://localhost:8080/api/v1/books', () => HttpResponse.json({ data: [] })),
    http.get('http://localhost:8080/api/v1/books/count', () =>
      HttpResponse.json({ data: { total: 0 } }),
    ),
    http.get('http://localhost:8080/api/v1/me/books', () => HttpResponse.json({ data: [] })),
    http.get('http://localhost:8080/api/v1/me/books/counts', () =>
      HttpResponse.json(myShelfCounts),
    ),
    http.get('http://localhost:8080/api/v1/reviews/recent', () => HttpResponse.json({ data: [] })),
  )
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

describe('router', () => {
  it('should show the log in page', async () => {
    renderAt('/login')

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument(),
    )
  })

  it('should show the home page without waiting for a download', () => {
    renderAt('/')

    expect(screen.getByRole('heading', { level: 1, name: /search/i })).toBeInTheDocument()
  })

  it('should render one header', async () => {
    renderAt('/about')

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /about betterreads/i })).toBeInTheDocument(),
    )
    expect(screen.getAllByRole('banner')).toHaveLength(1)
  })

  it('should set the route title', async () => {
    renderAt('/about')

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /about betterreads/i })).toBeInTheDocument(),
    )
    await waitFor(() => expect(document.title).toMatch(/about/i))
  })

  it('should title a loaded book', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/books/OL1W', () => HttpResponse.json({ data: book })),
      http.get('http://localhost:8080/api/v1/books/OL1W/reviews', () =>
        HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } }),
      ),
      http.get('http://localhost:8080/api/v1/books/OL1W/community-rating', () =>
        HttpResponse.json(noCommunityRating),
      ),
      http.get(
        'http://localhost:8080/api/v1/books/OL1W/shelf-counts',
        () => new HttpResponse(null, { status: 404 }),
      ),
    )

    renderAt('/books/OL1W')

    await screen.findByRole('heading', { name: 'Hunters of Dune' })
    await waitFor(() => expect(document.title).toMatch(/hunters of dune/i))
  })

  it('should show one search box on the search page', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/search/books', () =>
        HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 15 } }),
      ),
    )

    renderAt('/search?q=dune')

    await screen.findByRole('heading', { level: 1, name: 'Results for dune' })
    expect(screen.getAllByRole('searchbox')).toHaveLength(1)
  })

  it('should name a missing book separately from an unmatched page', async () => {
    server.use(
      http.get(
        'http://localhost:8080/api/v1/books/missing',
        () => new HttpResponse(null, { status: 404 }),
      ),
    )

    renderAt('/books/missing')

    expect(await screen.findByRole('heading', { name: /book/i })).toBeInTheDocument()
  })

  it('should announce the book detail skeleton while the book loads', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/books/slow', async () => {
        await delay('infinite')
        return HttpResponse.json({ data: {} })
      }),
    )

    renderAt('/books/slow')

    expect(await screen.findByRole('status', { name: /loading.*book/i })).toBeInTheDocument()
  })

  it('should render the route error page', () => {
    function Boom(): never {
      throw new Error('route blew up')
    }
    const errorBoundary: RouteObject = {
      errorElement: routes[0]!.errorElement,
      children: [{ children: [{ path: '/boom', element: <Boom /> }] }],
    }
    const router = createMemoryRouter([errorBoundary], { initialEntries: ['/boom'] })
    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    )

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument()
  })
})
