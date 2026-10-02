import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/hooks/useAuth'
import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn as stubAuthenticatedSession, stubSignedOut } from '@/testing/authHandlers'
import auth from '@/testing/mocks/auth.json'
import shelfEntry from '@/testing/mocks/shelf-entry.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor, within } from '@/testing/test-utils'

import { ShelfControl } from '../components/ShelfControl'

const AUTH_BASE = 'http://localhost:8080/api/v1/auth'
const SHELF_BASE = 'http://localhost:8080/api/v1/me/books'
const DUNE_KEY = 'OL893415W'
const OTHER_BOOK_KEY = 'OL2W'
const STATUS_LABELS = ['Want to read', 'Currently reading', 'Read', 'Dropped']
const READ_ENTRY = { ...shelfEntry, status: 'FINISHED' }
const FAVORITE_READ_ENTRY = { ...READ_ENTRY, favorite: true }
const SERVER_ERROR = 500
const REPORT_SETTLE_MS = 200

function stubSignOut() {
  server.use(http.post(`${AUTH_BASE}/logout`, () => new HttpResponse(null, { status: 204 })))
}

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
        onClick={() =>
          void login({ identifier: 'mustang', password: 'password', rememberMe: false })
        }
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

    expect(await screen.findByRole('link', { name: 'Log in to track this book' })).toHaveAttribute(
      'href',
      '/login',
    )
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
            data: [FAVORITE_READ_ENTRY],
          })
        }
        nextShelfRequested = true
        await heldNextShelf
        return HttpResponse.json({ data: [FAVORITE_READ_ENTRY] })
      }),
    )
    const { rerender } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await screen.findByRole('button', { name: /^read$/i })

    rerender(<ShelfControl bookKey={OTHER_BOOK_KEY} />)
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
        HttpResponse.json({ data: { ...auth, accessToken: 'jwt' } }),
      ),
      http.post(`${AUTH_BASE}/logout`, () => new HttpResponse(null, { status: 204 })),
      http.post(`${AUTH_BASE}/login`, () => {
        currentReader = 'mustang'
        return HttpResponse.json({
          data: {
            ...auth,
            accessToken: 'next-jwt',
            user: { ...auth.user, username: currentReader, email: `${currentReader}@example.com` },
          },
        })
      }),
      http.get(SHELF_BASE, async () => {
        if (currentReader === 'darrow') {
          return HttpResponse.json({
            data: [FAVORITE_READ_ENTRY],
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
    await screen.findByRole('link', { name: 'Log in to track this book' })
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
    stubSignedIn([READ_ENTRY])

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
          data: { ...shelfEntry, status: 'CURRENTLY_READING', startedAt: '2026-01-02' },
        })
      }),
    )
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await user.click(await screen.findByRole('button', { name: 'Choose shelf' }))

    await user.click(screen.getByRole('menuitemradio', { name: 'Currently reading' }))

    expect(await screen.findByRole('button', { name: 'Currently reading' })).toBeInTheDocument()
    expect(received).toEqual({ status: 'CURRENTLY_READING' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('should save want-to-read from the main button', async () => {
    stubSignedIn()
    let received: unknown
    server.use(
      http.put(`${SHELF_BASE}/${DUNE_KEY}/status`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({ data: shelfEntry })
      }),
    )
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)

    await user.click(await screen.findByRole('button', { name: 'Want to read' }))

    await waitFor(() => expect(received).toEqual({ status: 'WANT_TO_READ' }))
  })

  it('should offer only the four statuses before the book is shelved', async () => {
    stubSignedIn()
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)

    await user.click(await screen.findByRole('button', { name: 'Choose shelf' }))

    const menu = screen.getByRole('menu', { name: 'Reading status' })
    const options = within(menu).getAllByRole('menuitemradio')
    expect(options).toHaveLength(STATUS_LABELS.length)
    options.forEach((option, index) => expect(option).toHaveAccessibleName(STATUS_LABELS[index]))
    expect(within(menu).queryByRole('menuitem')).not.toBeInTheDocument()
  })

  it('should open the menu from the status button once shelved', async () => {
    stubSignedIn([READ_ENTRY])
    let statusWrites = 0
    server.use(
      http.put(`${SHELF_BASE}/${DUNE_KEY}/status`, () => {
        statusWrites += 1
        return HttpResponse.json({ data: READ_ENTRY })
      }),
    )
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    const statusButton = await screen.findByRole('button', { name: 'Read' })

    await user.click(statusButton)

    expect(screen.getByRole('menu', { name: 'Reading status' })).toBeInTheDocument()
    expect(statusButton).toHaveAttribute('aria-haspopup', 'menu')
    expect(statusButton).toHaveAttribute('aria-expanded', 'true')
    expect(statusWrites).toBe(0)
  })

  it('should drop the Choose shelf button once shelved', async () => {
    stubSignedIn([READ_ENTRY])

    renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await screen.findByRole('button', { name: 'Read' })

    expect(screen.queryByRole('button', { name: 'Choose shelf' })).not.toBeInTheDocument()
  })

  it('should check only the current status', async () => {
    stubSignedIn([READ_ENTRY])
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)

    await user.click(await screen.findByRole('button', { name: 'Read' }))

    expect(screen.getByRole('menuitemradio', { name: 'Read' })).toBeChecked()
    expect(screen.getByRole('menuitemradio', { name: 'Want to read' })).not.toBeChecked()
    expect(screen.getByRole('menuitemradio', { name: 'Currently reading' })).not.toBeChecked()
    expect(screen.getByRole('menuitemradio', { name: 'Dropped' })).not.toBeChecked()
  })

  it('should close the menu on Escape', async () => {
    stubSignedIn()
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await user.click(await screen.findByRole('button', { name: 'Choose shelf' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('should close the menu on a press outside it', async () => {
    stubSignedIn()
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await user.click(await screen.findByRole('button', { name: 'Choose shelf' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(document.body)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('should reset after removing the book', async () => {
    stubSignedIn([READ_ENTRY])
    let deleted = false
    server.use(
      http.delete(`${SHELF_BASE}/${DUNE_KEY}`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await user.click(await screen.findByRole('button', { name: 'Read' }))

    await user.click(screen.getByRole('menuitem', { name: 'Remove from shelf' }))

    expect(await screen.findByRole('button', { name: 'Choose shelf' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Want to read' })).toBeInTheDocument()
    expect(deleted).toBe(true)
  })

  it('should report the loaded entry', async () => {
    stubSignedIn([READ_ENTRY])
    const onEntryChange = vi.fn()

    renderWithProviders(<ShelfControl bookKey={DUNE_KEY} onEntryChange={onEntryChange} />)

    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(READ_ENTRY))
  })

  it('should report the new entry after a status change', async () => {
    stubSignedIn()
    server.use(
      http.put(`${SHELF_BASE}/${DUNE_KEY}/status`, () => HttpResponse.json({ data: shelfEntry })),
    )
    const onEntryChange = vi.fn()
    const { user } = renderWithProviders(
      <ShelfControl bookKey={DUNE_KEY} onEntryChange={onEntryChange} />,
    )

    await user.click(await screen.findByRole('button', { name: 'Want to read' }))

    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(shelfEntry))
  })

  it('should report no entry after removing the book', async () => {
    stubSignedIn([READ_ENTRY])
    server.use(
      http.delete(`${SHELF_BASE}/${DUNE_KEY}`, () => new HttpResponse(null, { status: 204 })),
    )
    const onEntryChange = vi.fn()
    const { user } = renderWithProviders(
      <ShelfControl bookKey={DUNE_KEY} onEntryChange={onEntryChange} />,
    )
    await user.click(await screen.findByRole('button', { name: 'Read' }))
    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(READ_ENTRY))

    await user.click(screen.getByRole('menuitem', { name: 'Remove from shelf' }))

    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(undefined))
  })

  it('should report no entry when the book changes to an unshelved one', async () => {
    stubSignedIn([READ_ENTRY])
    const onEntryChange = vi.fn()
    const { rerender } = renderWithProviders(
      <ShelfControl bookKey={DUNE_KEY} onEntryChange={onEntryChange} />,
    )
    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(READ_ENTRY))

    rerender(<ShelfControl bookKey={OTHER_BOOK_KEY} onEntryChange={onEntryChange} />)

    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(undefined))
  })

  it('should report no entry after the reader signs out', async () => {
    stubSignedIn([READ_ENTRY])
    stubSignOut()
    const onEntryChange = vi.fn()
    const { user } = renderWithProviders(
      <>
        <ShelfControl bookKey={DUNE_KEY} onEntryChange={onEntryChange} />
        <SessionActions />
      </>,
    )
    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(READ_ENTRY))

    await user.click(screen.getByRole('button', { name: 'Sign out test reader' }))

    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(undefined))
  })

  it('should not report an entry saved after the reader signed out', async () => {
    stubSignedIn()
    stubSignOut()
    let releaseSave: () => void = () => undefined
    const heldSave = new Promise<void>((resolve) => {
      releaseSave = resolve
    })
    server.use(
      http.put(`${SHELF_BASE}/${DUNE_KEY}/status`, async () => {
        await heldSave
        return HttpResponse.json({ data: shelfEntry })
      }),
    )
    const onEntryChange = vi.fn()
    const { user } = renderWithProviders(
      <>
        <ShelfControl bookKey={DUNE_KEY} onEntryChange={onEntryChange} />
        <SessionActions />
      </>,
    )
    await user.click(await screen.findByRole('button', { name: 'Want to read' }))
    await user.click(screen.getByRole('button', { name: 'Sign out test reader' }))
    await screen.findByRole('link', { name: 'Log in to track this book' })

    releaseSave()

    await expect(
      waitFor(() => expect(onEntryChange).toHaveBeenCalledWith(shelfEntry), {
        timeout: REPORT_SETTLE_MS,
      }),
    ).rejects.toThrow()
  })

  it('should report no entry when the shelf fails to load', async () => {
    stubSignedIn()
    server.use(http.get(SHELF_BASE, () => new HttpResponse(null, { status: SERVER_ERROR })))
    const onEntryChange = vi.fn()

    renderWithProviders(<ShelfControl bookKey={DUNE_KEY} onEntryChange={onEntryChange} />)

    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(undefined))
  })

  it('should say when the shelf fails to load', async () => {
    stubSignedIn()
    server.use(http.get(SHELF_BASE, () => new HttpResponse(null, { status: SERVER_ERROR })))

    renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load your shelf. Reload the page.',
    )
  })

  it('should toggle the favorite flag when signed in', async () => {
    stubSignedIn()
    let received: unknown
    server.use(
      http.put(`${SHELF_BASE}/${DUNE_KEY}/favorite`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({ data: { ...shelfEntry, favorite: true } })
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
      http.put(
        `${SHELF_BASE}/${DUNE_KEY}/status`,
        () => new HttpResponse(null, { status: SERVER_ERROR }),
      ),
    )
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await screen.findByRole('button', { name: /want to read/i })

    await user.click(screen.getByRole('button', { name: /choose shelf/i }))
    await user.click(screen.getByRole('menuitemradio', { name: /currently reading/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save your shelf. Try again.',
    )
  })
})
