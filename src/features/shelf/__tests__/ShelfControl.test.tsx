import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/hooks/useAuth'
import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn, stubSignedOut } from '@/testing/authHandlers'
import { holdResponse } from '@/testing/holdResponse'
import auth from '@/testing/mocks/auth.json'
import shelfEntry from '@/testing/mocks/shelf-entry.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor, within } from '@/testing/test-utils'

import { ShelfControl } from '../components/ShelfControl'

const AUTH_BASE = 'http://localhost:8080/api/v1/auth'
const SHELF_BASE = 'http://localhost:8080/api/v1/me/books'
const DUNE_KEY = 'OL893415W'
const OTHER_BOOK_KEY = 'OL2W'
const STATUS_LABELS = ['Want to read', 'Currently reading', 'Read', 'Did not finish']
const READ_ENTRY = { ...shelfEntry, status: 'FINISHED' as const }
const FAVORITE_READ_ENTRY = { ...READ_ENTRY, favorite: true }
const SERVER_ERROR = 500
const REPORT_SETTLE_MS = 200

type User = ReturnType<typeof renderWithProviders>['user']

function stubSignOut() {
  server.use(http.post(`${AUTH_BASE}/logout`, () => new HttpResponse(null, { status: 204 })))
}

function stubReader(shelf: Record<string, unknown>[] = []) {
  stubSignedIn()
  server.use(http.get(SHELF_BASE, () => HttpResponse.json({ data: shelf })))
}

function recordWrite(path: 'status' | 'favorite', saved: Record<string, unknown>) {
  const sent: { body?: unknown } = {}
  server.use(
    http.put(`${SHELF_BASE}/${DUNE_KEY}/${path}`, async ({ request }) => {
      sent.body = await request.json()
      return HttpResponse.json({ data: saved })
    }),
  )
  return sent
}

function renderReporting() {
  const onEntryChange = vi.fn()
  const rendered = renderWithProviders(
    <>
      <ShelfControl bookKey={DUNE_KEY} onEntryChange={onEntryChange} />
      <SessionActions />
    </>,
  )
  return { onEntryChange, ...rendered }
}

async function expectUnshelvedUntilLoaded(requested: () => boolean, release: () => void) {
  await waitFor(() => expect(requested()).toBe(true))
  expect(screen.getByRole('button', { name: /want to read/i })).toBeInTheDocument()
  release()
  await waitFor(() => expect(screen.getByRole('button', { name: /want to read/i })).toBeEnabled())
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
          void login({ identifier: 'otheruser', password: 'password', rememberMe: false })
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
    stubReader()
    let shelfRequested = false
    const shelf = holdResponse()
    server.use(
      http.get(SHELF_BASE, async () => {
        shelfRequested = true
        await shelf.held
        return HttpResponse.json({ data: [] })
      }),
    )

    renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await waitFor(() => expect(shelfRequested).toBe(true))

    expect(screen.getByRole('button', { name: /want to read/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /choose shelf/i })).toBeDisabled()

    shelf.release()
    await waitFor(() => expect(screen.getByRole('button', { name: /want to read/i })).toBeEnabled())
  })

  it('should clear the previous entry while an unshelved book is loading', async () => {
    stubReader()
    let requestCount = 0
    let nextShelfRequested = false
    const nextShelf = holdResponse()
    server.use(
      http.get(SHELF_BASE, async () => {
        requestCount += 1
        if (requestCount > 1) {
          nextShelfRequested = true
          await nextShelf.held
        }
        return HttpResponse.json({ data: [FAVORITE_READ_ENTRY] })
      }),
    )
    const { rerender } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await screen.findByRole('button', { name: /^read$/i })

    rerender(<ShelfControl bookKey={OTHER_BOOK_KEY} />)

    await expectUnshelvedUntilLoaded(() => nextShelfRequested, nextShelf.release)
  })

  it("should clear the previous reader's entry after the session changes", async () => {
    let currentReader = 'user'
    let nextShelfRequested = false
    const nextShelf = holdResponse()
    server.use(
      http.post(`${AUTH_BASE}/refresh`, () =>
        HttpResponse.json({ data: { ...auth, accessToken: 'jwt' } }),
      ),
      http.post(`${AUTH_BASE}/logout`, () => new HttpResponse(null, { status: 204 })),
      http.post(`${AUTH_BASE}/login`, () => {
        currentReader = 'otheruser'
        return HttpResponse.json({
          data: {
            ...auth,
            accessToken: 'next-jwt',
            user: { ...auth.user, username: currentReader, email: `${currentReader}@example.com` },
          },
        })
      }),
      http.get(SHELF_BASE, async () => {
        if (currentReader === 'user') {
          return HttpResponse.json({ data: [FAVORITE_READ_ENTRY] })
        }
        nextShelfRequested = true
        await nextShelf.held
        return HttpResponse.json({ data: [] })
      }),
    )
    const { user } = renderReporting()
    await screen.findByRole('button', { name: /^read$/i })
    await user.click(screen.getByRole('button', { name: /sign out test reader/i }))
    await screen.findByRole('link', { name: 'Log in to track this book' })

    await user.click(screen.getByRole('button', { name: /sign in test reader/i }))

    await expectUnshelvedUntilLoaded(() => nextShelfRequested, nextShelf.release)
  })

  it('should show the chosen shelf status', async () => {
    stubReader()
    const sent = recordWrite('status', {
      ...shelfEntry,
      status: 'CURRENTLY_READING',
      startedAt: '2026-01-02',
    })
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await user.click(await screen.findByRole('button', { name: 'Choose shelf' }))

    await user.click(screen.getByRole('menuitemradio', { name: 'Currently reading' }))

    expect(await screen.findByRole('button', { name: 'Currently reading' })).toBeInTheDocument()
    expect(sent.body).toEqual({ status: 'CURRENTLY_READING' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('should save want-to-read from the main button', async () => {
    stubReader()
    const sent = recordWrite('status', shelfEntry)
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)

    await user.click(await screen.findByRole('button', { name: 'Want to read' }))

    await waitFor(() => expect(sent.body).toEqual({ status: 'WANT_TO_READ' }))
  })

  it('should offer only the four statuses before the book is shelved', async () => {
    stubReader()
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)

    await user.click(await screen.findByRole('button', { name: 'Choose shelf' }))

    const menu = screen.getByRole('menu', { name: 'Reading status' })
    const options = within(menu).getAllByRole('menuitemradio')
    expect(options).toHaveLength(STATUS_LABELS.length)
    options.forEach((option, index) => expect(option).toHaveAccessibleName(STATUS_LABELS[index]))
    expect(within(menu).queryByRole('menuitem')).not.toBeInTheDocument()
  })

  it('should open the menu from the status button once shelved', async () => {
    stubReader([READ_ENTRY])
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

  it('should show the saved status in place of Choose shelf', async () => {
    stubReader([READ_ENTRY])

    renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)

    expect(await screen.findByRole('button', { name: 'Read' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Choose shelf' })).not.toBeInTheDocument()
  })

  it('should check only the current status', async () => {
    stubReader([READ_ENTRY])
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)

    await user.click(await screen.findByRole('button', { name: 'Read' }))

    expect(screen.getByRole('menuitemradio', { name: 'Read' })).toBeChecked()
    expect(screen.getByRole('menuitemradio', { name: 'Want to read' })).not.toBeChecked()
    expect(screen.getByRole('menuitemradio', { name: 'Currently reading' })).not.toBeChecked()
    expect(screen.getByRole('menuitemradio', { name: 'Did not finish' })).not.toBeChecked()
  })

  it.each([
    ['Escape', (user: User) => user.keyboard('{Escape}')],
    ['a press outside it', (user: User) => user.click(document.body)],
  ])('should close the menu on %s', async (_dismissal, dismiss) => {
    stubReader()
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await user.click(await screen.findByRole('button', { name: 'Choose shelf' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await dismiss(user)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('should return focus to the shelf button on Escape', async () => {
    stubReader()
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    const trigger = await screen.findByRole('button', { name: 'Choose shelf' })
    await user.click(trigger)
    await user.tab()
    expect(screen.getAllByRole('menuitemradio')[0]).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
  })

  it('should reset after removing the book', async () => {
    stubReader([READ_ENTRY])
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
    stubReader([READ_ENTRY])

    const { onEntryChange } = renderReporting()

    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(READ_ENTRY))
  })

  it('should report the new entry after a status change', async () => {
    stubReader()
    recordWrite('status', shelfEntry)
    const { user, onEntryChange } = renderReporting()

    await user.click(await screen.findByRole('button', { name: 'Want to read' }))

    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(shelfEntry))
  })

  it('should report no entry after removing the book', async () => {
    stubReader([READ_ENTRY])
    server.use(
      http.delete(`${SHELF_BASE}/${DUNE_KEY}`, () => new HttpResponse(null, { status: 204 })),
    )
    const { user, onEntryChange } = renderReporting()
    await user.click(await screen.findByRole('button', { name: 'Read' }))
    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(READ_ENTRY))

    await user.click(screen.getByRole('menuitem', { name: 'Remove from shelf' }))

    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(undefined))
  })

  it('should report no entry when the book changes to an unshelved one', async () => {
    stubReader([READ_ENTRY])
    const onEntryChange = vi.fn()
    const { rerender } = renderWithProviders(
      <ShelfControl bookKey={DUNE_KEY} onEntryChange={onEntryChange} />,
    )
    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(READ_ENTRY))

    rerender(<ShelfControl bookKey={OTHER_BOOK_KEY} onEntryChange={onEntryChange} />)

    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(undefined))
  })

  it('should report no entry after the reader signs out', async () => {
    stubReader([READ_ENTRY])
    stubSignOut()
    const { user, onEntryChange } = renderReporting()
    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(READ_ENTRY))

    await user.click(screen.getByRole('button', { name: 'Sign out test reader' }))

    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(undefined))
  })

  it('should not report an entry saved after the reader signed out', async () => {
    stubReader()
    stubSignOut()
    const save = holdResponse()
    server.use(
      http.put(`${SHELF_BASE}/${DUNE_KEY}/status`, async () => {
        await save.held
        return HttpResponse.json({ data: shelfEntry })
      }),
    )
    const { user, onEntryChange } = renderReporting()
    await user.click(await screen.findByRole('button', { name: 'Want to read' }))
    await user.click(screen.getByRole('button', { name: 'Sign out test reader' }))
    await screen.findByRole('link', { name: 'Log in to track this book' })

    save.release()

    await expect(
      waitFor(() => expect(onEntryChange).toHaveBeenCalledWith(shelfEntry), {
        timeout: REPORT_SETTLE_MS,
      }),
    ).rejects.toThrow()
  })

  it('should report no entry when the shelf fails to load', async () => {
    stubReader()
    server.use(http.get(SHELF_BASE, () => new HttpResponse(null, { status: SERVER_ERROR })))

    const { onEntryChange } = renderReporting()

    await waitFor(() => expect(onEntryChange).toHaveBeenLastCalledWith(undefined))
  })

  it('should say when the shelf fails to load', async () => {
    stubReader()
    server.use(http.get(SHELF_BASE, () => new HttpResponse(null, { status: SERVER_ERROR })))

    renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load your books. Reload the page.',
    )
  })

  it('should add a favorite from the menu', async () => {
    stubReader([READ_ENTRY])
    const sent = recordWrite('favorite', FAVORITE_READ_ENTRY)
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await user.click(await screen.findByRole('button', { name: 'Read' }))

    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Add to favorites' }))

    await waitFor(() => expect(sent.body).toEqual({ favorite: true }))
    await user.click(await screen.findByRole('button', { name: 'Read' }))
    expect(screen.getByRole('menuitemcheckbox', { name: 'Favorite' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('should remove a favorite from the menu', async () => {
    stubReader([FAVORITE_READ_ENTRY])
    const sent = recordWrite('favorite', READ_ENTRY)
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)
    await user.click(await screen.findByRole('button', { name: 'Read' }))

    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Favorite' }))

    await waitFor(() => expect(sent.body).toEqual({ favorite: false }))
  })

  it('should not load the shelf when given an entry', async () => {
    stubSignedIn()
    let shelfRequested = false
    server.use(
      http.get(SHELF_BASE, () => {
        shelfRequested = true
        return HttpResponse.json({ data: [READ_ENTRY] })
      }),
    )

    renderWithProviders(<ShelfControl bookKey={DUNE_KEY} entry={READ_ENTRY} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Read' })).toBeEnabled())

    await expect(
      waitFor(() => expect(shelfRequested).toBe(true), { timeout: REPORT_SETTLE_MS }),
    ).rejects.toThrow()
  })

  it('should disable the shelf buttons while a status saves', async () => {
    stubReader()
    const save = holdResponse()
    server.use(
      http.put(`${SHELF_BASE}/${DUNE_KEY}/status`, async () => {
        await save.held
        return HttpResponse.json({ data: shelfEntry })
      }),
    )
    const { user } = renderWithProviders(<ShelfControl bookKey={DUNE_KEY} />)

    await user.click(await screen.findByRole('button', { name: 'Want to read' }))

    expect(screen.getByRole('button', { name: 'Want to read' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Choose shelf' })).toBeDisabled()
    save.release()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Want to read' })).toBeEnabled())
  })

  it('should say when a status change fails to save', async () => {
    stubReader()
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
