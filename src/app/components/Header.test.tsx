import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { changeFavorite } from '@/features/shelf/api/changeFavorite'
import { changeShelfStatus } from '@/features/shelf/api/changeShelfStatus'
import { removeFromShelf } from '@/features/shelf/api/removeFromShelf'
import { notifyShelfChanged } from '@/features/shelf/api/shelfChanges'
import { useAuth } from '@/hooks/useAuth'
import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn, stubSignedOut } from '@/testing/authHandlers'
import { CurrentLocation } from '@/testing/CurrentLocation'
import { holdResponse } from '@/testing/holdResponse'
import auth from '@/testing/mocks/auth.json'
import myShelfCounts from '@/testing/mocks/my-shelf-counts.json'
import shelfEntry from '@/testing/mocks/shelf-entry.json'
import { server } from '@/testing/msw-server'
import { act, renderWithProviders, screen, waitFor, within } from '@/testing/test-utils'

import { Header } from './Header'

const AUTH_BASE = 'http://localhost:8080/api/v1/auth'
const COUNTS_URL = 'http://localhost:8080/api/v1/me/books/counts'
const SHELF_BASE = 'http://localhost:8080/api/v1/me/books'
const SERVER_ERROR = 500
const FAILURE_SETTLE_MS = 200

function stubShelfCounts(total = myShelfCounts.data.total) {
  server.use(http.get(COUNTS_URL, () => HttpResponse.json({ data: { total } })))
}

function renderHeader(route = '/') {
  return renderWithProviders(
    <>
      <Header />
      <CurrentLocation />
    </>,
    { route },
  )
}

function SignInAgain() {
  const { login } = useAuth()
  return (
    <button
      type="button"
      onClick={() => void login({ identifier: 'user', password: 'password', rememberMe: false })}
    >
      Sign in again
    </button>
  )
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('Header', () => {
  it('should show anonymous navigation', async () => {
    stubSignedOut()

    renderHeader()

    await waitFor(() => expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
  })

  it('should show authenticated navigation', async () => {
    stubSignedIn()
    stubShelfCounts()

    renderHeader()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /account menu/i })).toBeInTheDocument(),
    )
    expect(screen.getByRole('link', { name: /my books/i })).toBeInTheDocument()
  })

  it('should show the shelf count on the My books link', async () => {
    stubSignedIn()
    stubShelfCounts()

    renderHeader()

    expect(await screen.findByRole('link', { name: 'My books, 16 books' })).toHaveAttribute(
      'href',
      '/shelf',
    )
  })

  it('should mark My books as the current page on the shelf', async () => {
    stubSignedIn()
    stubShelfCounts()

    renderHeader('/shelf')

    expect(await screen.findByRole('link', { name: 'My books, 16 books' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('should not mark My books as the current page away from the shelf', async () => {
    stubSignedIn()
    stubShelfCounts()

    renderHeader('/profile')

    expect(await screen.findByRole('link', { name: 'My books, 16 books' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('should say book for a shelf of one', async () => {
    stubSignedIn()
    stubShelfCounts(1)

    renderHeader()

    expect(await screen.findByRole('link', { name: 'My books, 1 book' })).toBeInTheDocument()
  })

  it.each([
    ['a shelf change', 1, () => changeShelfStatus(shelfEntry.key, 'WANT_TO_READ')],
    ['a removal', -1, () => removeFromShelf(shelfEntry.key)],
  ])('should update the count after %s', async (_write, change, write) => {
    stubSignedIn()
    let total = myShelfCounts.data.total
    server.use(
      http.get(COUNTS_URL, () => HttpResponse.json({ data: { total } })),
      http.put(`${SHELF_BASE}/${shelfEntry.key}/status`, () => {
        total += change
        return HttpResponse.json({ data: shelfEntry })
      }),
      http.delete(`${SHELF_BASE}/${shelfEntry.key}`, () => {
        total += change
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderHeader()
    await screen.findByRole('link', { name: 'My books, 16 books' })

    await act(async () => {
      await write()
    })

    expect(
      await screen.findByRole('link', {
        name: `My books, ${myShelfCounts.data.total + change} books`,
      }),
    ).toBeInTheDocument()
  })

  it('should load the count again after a favorite change', async () => {
    stubSignedIn()
    let countRequests = 0
    server.use(
      http.get(COUNTS_URL, () => {
        countRequests += 1
        return HttpResponse.json(myShelfCounts)
      }),
      http.put(`${SHELF_BASE}/${shelfEntry.key}/favorite`, () =>
        HttpResponse.json({ data: { ...shelfEntry, favorite: true } }),
      ),
    )
    renderHeader()
    await screen.findByRole('link', { name: 'My books, 16 books' })

    await act(() => changeFavorite(shelfEntry.key, true))

    await waitFor(() => expect(countRequests).toBe(2))
  })

  it('should show the My books link without a count when the count fails', async () => {
    stubSignedIn()
    let countsRequested = false
    server.use(
      http.get(COUNTS_URL, () => {
        countsRequested = true
        return new HttpResponse(null, { status: SERVER_ERROR })
      }),
    )

    renderHeader()
    await waitFor(() => expect(countsRequested).toBe(true))

    await expect(
      waitFor(() => expect(screen.queryByRole('link', { name: /my books/i })).toBeNull(), {
        timeout: FAILURE_SETTLE_MS,
      }),
    ).rejects.toThrow()
    expect(screen.getByRole('link', { name: 'My books' })).toBeInTheDocument()
  })

  it('should drop the count when a later reload fails', async () => {
    stubSignedIn()
    let countRequests = 0
    server.use(
      http.get(COUNTS_URL, () => {
        countRequests += 1
        return countRequests === 1
          ? HttpResponse.json(myShelfCounts)
          : new HttpResponse(null, { status: SERVER_ERROR })
      }),
    )
    renderHeader()
    await screen.findByRole('link', { name: 'My books, 16 books' })

    act(() => notifyShelfChanged())

    expect(await screen.findByRole('link', { name: 'My books' })).toBeInTheDocument()
  })

  it('should drop the count after signing out', async () => {
    stubSignedIn()
    let countRequests = 0
    const laterCounts = holdResponse()
    server.use(
      http.get(COUNTS_URL, async () => {
        countRequests += 1
        if (countRequests > 1) {
          await laterCounts.held
        }
        return HttpResponse.json(myShelfCounts)
      }),
      http.post(`${AUTH_BASE}/logout`, () => new HttpResponse(null, { status: 204 })),
      http.post(`${AUTH_BASE}/login`, () => HttpResponse.json({ data: auth })),
    )
    const { user } = renderWithProviders(
      <>
        <Header />
        <SignInAgain />
      </>,
    )
    await screen.findByRole('link', { name: 'My books, 16 books' })
    await user.click(screen.getByRole('button', { name: /account menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /log out/i }))
    await screen.findByRole('link', { name: /log in/i })

    await user.click(screen.getByRole('button', { name: 'Sign in again' }))

    expect(await screen.findByRole('link', { name: 'My books' })).toBeInTheDocument()
  })

  it('should show a search box away from the home page', () => {
    stubSignedOut()

    renderHeader('/books/OL1W')

    expect(within(screen.getByRole('banner')).getByRole('searchbox')).toBeInTheDocument()
  })

  it('should show no search box on the home page', () => {
    stubSignedOut()

    renderHeader('/')

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).toBeNull()
  })

  it('should go to the search page with the submitted query', async () => {
    stubSignedOut()
    const { user } = renderHeader('/about')
    const banner = within(screen.getByRole('banner'))

    await user.type(banner.getByRole('searchbox'), 'wheel of time')
    await user.click(banner.getByRole('button', { name: 'Search' }))

    expect(screen.getByText('/search?q=wheel+of+time')).toBeInTheDocument()
  })

  it('should hold the current query on the search page', () => {
    stubSignedOut()

    renderHeader('/search?q=dune')

    expect(within(screen.getByRole('banner')).getByRole('searchbox')).toHaveValue('dune')
  })
})
