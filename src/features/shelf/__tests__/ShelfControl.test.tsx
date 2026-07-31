import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { useAuth } from '@/hooks/useAuth'
import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn as stubAuthenticatedSession, stubSignedOut } from '@/testing/authHandlers'
import { makeAuthResponse } from '@/testing/mocks/auth'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { ShelfControl } from '../components/ShelfControl'

import { makeShelfEntry } from './mocks/shelfEntry'

const AUTH_BASE = 'http://localhost:8080/api/v1/auth'
const SHELF_BASE = 'http://localhost:8080/api/v1/me/books'
const DUNE_KEY = 'OL893415W'

function stubSignedIn(shelf: Record<string, unknown>[] = []) {
  stubAuthenticatedSession()
  server.use(http.get(SHELF_BASE, () => HttpResponse.json({ data: shelf })))
}

function SessionActions() {
  const { login, logout } = useAuth()
  return (
    <>
      <button type="button" onClick={() => void logout()}>
        Sign out test reader
      </button>
      <button
        type="button"
        onClick={() => void login({ identifier: 'mustang', password: 'password' })}
      >
        Sign in test reader
      </button>
    </>
  )
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('ShelfControl', () => {
  it('should prompt signed-out readers', async () => {
    stubSignedOut()

    renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)

    await waitFor(() => expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /want to read/i })).not.toBeInTheDocument()
  })

  it('should disable shelf writes until the existing entry is known', async () => {
    stubSignedIn()
    let shelfRequested = false
    let releaseShelf: () => void = () => undefined
    const heldShelf = new Promise<void>((resolve) => {
      releaseShelf = resolve
    })
    server.use(
      http.get(SHELF_BASE, async () => {
        shelfRequested = true
        await heldShelf
        return HttpResponse.json({ data: [] })
      }),
    )

    renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await waitFor(() => expect(shelfRequested).toBe(true))

    expect(screen.getByRole('button', { name: /want to read/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /choose shelf/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /add to favorites/i })).toBeDisabled()

    releaseShelf()
    await waitFor(() => expect(screen.getByRole('button', { name: /want to read/i })).toBeEnabled())
  })

  it('should clear the previous entry while an unshelved book is loading', async () => {
    stubSignedIn()
    let requestCount = 0
    let nextShelfRequested = false
    let releaseNextShelf: () => void = () => undefined
    const heldNextShelf = new Promise<void>((resolve) => {
      releaseNextShelf = resolve
    })
    server.use(
      http.get(SHELF_BASE, async () => {
        requestCount += 1
        if (requestCount === 1) {
          return HttpResponse.json({
            data: [makeShelfEntry({ status: 'FINISHED', favorite: true })],
          })
        }
        nextShelfRequested = true
        await heldNextShelf
        return HttpResponse.json({ data: [makeShelfEntry({ status: 'FINISHED', favorite: true })] })
      }),
    )
    const { rerender } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await screen.findByRole('button', { name: /^read$/i })

    rerender(<ShelfControl bookKey="OL2W" />)
    await waitFor(() => expect(nextShelfRequested).toBe(true))

    expect(screen.getByRole('button', { name: /want to read/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add to favorites/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    releaseNextShelf()
    await waitFor(() => expect(screen.getByRole('button', { name: /want to read/i })).toBeEnabled())
  })

  it("should clear the previous reader's entry after the session changes", async () => {
    let currentReader = 'darrow'
    let nextShelfRequested = false
    let releaseNextShelf: () => void = () => undefined
    const heldNextShelf = new Promise<void>((resolve) => {
      releaseNextShelf = resolve
    })
    server.use(
      http.post(`${AUTH_BASE}/refresh`, () =>
        HttpResponse.json({ data: makeAuthResponse({ accessToken: 'jwt' }) }),
      ),
      http.post(`${AUTH_BASE}/logout`, () => new HttpResponse(null, { status: 204 })),
      http.post(`${AUTH_BASE}/login`, () => {
        currentReader = 'mustang'
        return HttpResponse.json({
          data: makeAuthResponse(
            { accessToken: 'next-jwt' },
            { username: currentReader, email: `${currentReader}@example.com` },
          ),
        })
      }),
      http.get(SHELF_BASE, async () => {
        if (currentReader === 'darrow') {
          return HttpResponse.json({
            data: [makeShelfEntry({ status: 'FINISHED', favorite: true })],
          })
        }
        nextShelfRequested = true
        await heldNextShelf
        return HttpResponse.json({ data: [] })
      }),
    )
    const { user } = renderWithProviders(
      <>
        <ShelfControl bookKey={DUNE_KEY} />
        <SessionActions />
      </>,
    )
    await screen.findByRole('button', { name: /^read$/i })

    await user.click(screen.getByRole('button', { name: /sign out test reader/i }))
    await screen.findByRole('link', { name: /sign in to track/i })
    await user.click(screen.getByRole('button', { name: /sign in test reader/i }))
    await waitFor(() => expect(nextShelfRequested).toBe(true))

    expect(screen.getByRole('button', { name: /want to read/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add to favorites/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    releaseNextShelf()
    await waitFor(() => expect(screen.getByRole('button', { name: /want to read/i })).toBeEnabled())
  })

  it('should reflect an already-shelved status on mount', async () => {
    stubSignedIn([makeShelfEntry({ status: 'FINISHED' })])

    renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)

    expect(await screen.findByRole('button', { name: /^read$/i })).toBeInTheDocument()
  })

  it('should show the chosen shelf status', async () => {
    stubSignedIn()
    let received: unknown
    server.use(
      http.put(`${SHELF_BASE}/${DUNE_KEY}/status`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({
          data: makeShelfEntry({ status: 'CURRENTLY_READING', startedAt: '2026-01-02' }),
        })
      }),
    )
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    const shelfButton = await screen.findByRole('button', { name: /want to read/i })

    await user.click(screen.getByRole('button', { name: /choose shelf/i }))
    await user.click(screen.getByRole('menuitem', { name: /currently reading/i }))

    await waitFor(() => expect(received).toEqual({ status: 'CURRENTLY_READING' }))
    expect(shelfButton).toHaveTextContent(/currently reading/i)
  })

  it('should reset after removing the book', async () => {
    stubSignedIn([makeShelfEntry({ status: 'FINISHED' })])
    let deleted = false
    server.use(
      http.delete(`${SHELF_BASE}/${DUNE_KEY}`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await screen.findByRole('button', { name: /^read$/i })

    await user.click(screen.getByRole('button', { name: /choose shelf/i }))
    await user.click(screen.getByRole('menuitem', { name: /remove from shelf/i }))

    await waitFor(() => expect(deleted).toBe(true))
    expect(await screen.findByRole('button', { name: /want to read/i })).toBeInTheDocument()
  })

  it('should toggle the favorite flag when signed in', async () => {
    stubSignedIn()
    let received: unknown
    server.use(
      http.put(`${SHELF_BASE}/${DUNE_KEY}/favorite`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({ data: makeShelfEntry({ favorite: true }) })
      }),
    )
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await screen.findByRole('button', { name: /want to read/i })

    await user.click(screen.getByRole('button', { name: /favorite/i }))

    await waitFor(() => expect(received).toEqual({ favorite: true }))
  })

  it('should surface an error when the status write fails', async () => {
    stubSignedIn()
    server.use(
      http.put(`${SHELF_BASE}/${DUNE_KEY}/status`, () => new HttpResponse(null, { status: 500 })),
    )
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await screen.findByRole('button', { name: /want to read/i })

    await user.click(screen.getByRole('button', { name: /choose shelf/i }))
    await user.click(screen.getByRole('menuitem', { name: /currently reading/i }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
