import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn } from '@/testing/authHandlers'
import shelfEntry from '@/testing/mocks/shelf-entry.json'
import { server } from '@/testing/msw-server'
import { DARK_AGE, GOLDEN_SON, IRON_GOLD, MORNING_STAR, RED_RISING } from '@/testing/readingHistory'
import { renderWithProviders, screen, within } from '@/testing/test-utils'

import { ProfileRoute } from './ProfileRoute'

const SHELF_URL = 'http://localhost:8080/api/v1/me/books'
const SERVER_ERROR = 500
const JUNE = 5

const SHELF = [
  shelfEntry,
  { ...RED_RISING, favorite: true },
  GOLDEN_SON,
  MORNING_STAR,
  { ...IRON_GOLD, status: 'CURRENTLY_READING', finishedAt: null },
  { ...DARK_AGE, favorite: true },
]

function titlesIn(section: string) {
  return within(screen.getByRole('region', { name: section }))
    .getAllByRole('link')
    .map((link) => SHELF.find((entry) => link.textContent?.includes(entry.title)))
    .map((entry) => entry?.title)
}

function renderProfile(shelf: unknown[] = SHELF) {
  server.use(http.get(SHELF_URL, () => HttpResponse.json({ data: shelf })))
  renderWithProviders(<ProfileRoute />, { route: '/profile' })
}

beforeEach(stubSignedIn)

afterEach(() => {
  vi.useRealTimers()
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('ProfileRoute', () => {
  it.each([
    ['Read', /^3\s*Read$/, '/shelf?shelf=FINISHED'],
    ['Currently reading', /^2\s*Currently reading$/, '/shelf?shelf=CURRENTLY_READING'],
    ['Want to read', /^1\s*Want to read$/, '/shelf?shelf=WANT_TO_READ'],
    ['Favorites', /^2\s*Favorites$/, '/shelf?shelf=FAVORITES'],
  ])('should link the %s count to its shelf', async (_shelf, name, href) => {
    renderProfile()

    expect(await screen.findByRole('link', { name })).toHaveAttribute('href', href)
  })

  it('should list the books being read under Currently reading', async () => {
    renderProfile()
    await screen.findByRole('region', { name: 'Currently reading' })

    expect(titlesIn('Currently reading')).toEqual(['Iron Gold', 'Dark Age'])
  })

  it('should show the newest finished book first under Recently read', async () => {
    renderProfile()
    await screen.findByRole('region', { name: 'Recently read' })

    expect(titlesIn('Recently read')).toEqual(['Golden Son', 'Red Rising', 'Morning Star'])
  })

  it('should show stars for a rated recently read book', async () => {
    renderProfile([{ ...GOLDEN_SON, myRating: 4 }])

    const recent = within(await screen.findByRole('region', { name: 'Recently read' }))
    expect(recent.getByRole('img', { name: 'Rated 4 of 5' })).toBeInTheDocument()
    expect(recent.queryByText('Jun 12, 2026')).toBeNull()
  })

  it('should show the finish date for an unrated recently read book', async () => {
    renderProfile([RED_RISING])

    const recent = within(await screen.findByRole('region', { name: 'Recently read' }))
    expect(recent.getByText('Jun 5, 2026')).toBeInTheDocument()
  })

  it('should list the favorites with their shelf', async () => {
    renderProfile()

    const links = within(await screen.findByRole('region', { name: 'Favorites' })).getAllByRole(
      'link',
    )
    expect(links.map((link) => link.textContent)).toEqual([
      expect.stringMatching(/^Read\s*Red Rising/),
      expect.stringMatching(/^Currently reading\s*Dark Age/),
    ])
  })

  it('should show the username and the number of books', async () => {
    renderProfile()

    expect(await screen.findByText('@user · 6 books')).toBeInTheDocument()
  })

  it('should leave out the shelf rows for an empty shelf', async () => {
    renderProfile([])
    await screen.findByRole('region', { name: 'Statistics' })

    expect(screen.queryByRole('region', { name: 'Currently reading' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Favorites' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Recently read' })).toBeNull()
  })

  it("should open the reading calendar on today's month", async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, JUNE, 15))

    renderProfile()

    expect(await screen.findByText('June 2026')).toBeInTheDocument()
    expect(screen.getByText('Read in 2026')).toBeInTheDocument()
  })

  it('should show an error when the shelf fails to load', async () => {
    server.use(http.get(SHELF_URL, () => new HttpResponse(null, { status: SERVER_ERROR })))

    renderWithProviders(<ProfileRoute />, { route: '/profile' })

    expect(
      await screen.findByText('Could not load your books. Reload the page.'),
    ).toBeInTheDocument()
    expect(screen.getByText('@user')).toBeInTheDocument()
  })

  it('should show when a book being read was started', async () => {
    renderProfile([{ ...DARK_AGE, startedAt: '2026-06-01' }])

    const reading = within(await screen.findByRole('region', { name: 'Currently reading' }))
    expect(reading.getByText('Started Jun 1, 2026')).toBeInTheDocument()
  })
})
