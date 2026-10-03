import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn, stubSignedOut } from '@/testing/authHandlers'
import bookSeries from '@/testing/mocks/book-series.json'
import book from '@/testing/mocks/book.json'
import communityRating from '@/testing/mocks/community-rating.json'
import noCommunityRating from '@/testing/mocks/no-community-rating.json'
import shelfCounts from '@/testing/mocks/shelf-counts.json'
import shelfEntry from '@/testing/mocks/shelf-entry.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor, within } from '@/testing/test-utils'

import { BookRoute } from './BookRoute'

const API_URL = 'http://localhost:8080/api/v1'
const BOOK_URL = `${API_URL}/books/${book.key}`
const SHELF_URL = `${API_URL}/me/books`
const STAT_LABELS = ['Reviews', 'Reading now', 'Read', 'Want to read']
const STATS_SETTLE_MS = 200
const SERVER_ERROR = 500
const SUN_EATER = { ...bookSeries, name: 'Sun Eater' }
const SERIES_ROW = /^Also in /
const READ_ENTRY = { ...shelfEntry, key: book.key, status: 'FINISHED', finishedAt: '2026-02-14' }
const READ_STAMP = /Read\s*Feb 14, 2026/
const DATED_ENTRY = {
  ...shelfEntry,
  key: book.key,
  addedAt: '2026-01-05',
  startedAt: '2026-01-20',
  finishedAt: '2026-02-14',
}

function stubBookPage(reviews: () => Response) {
  stubSignedOut()
  server.use(
    http.get(BOOK_URL, () => HttpResponse.json({ data: book })),
    http.get(`${BOOK_URL}/reviews`, reviews),
    http.get(`${BOOK_URL}/community-rating`, () => HttpResponse.json(noCommunityRating)),
    http.get(`${BOOK_URL}/series`, () => HttpResponse.json({ data: [] })),
  )
}

function reviewTotal(total: number) {
  return () => HttpResponse.json({ data: [], meta: { total, offset: 0, limit: 20 } })
}

function stubBookRead(path: string, reply: () => Response) {
  const requests: string[] = []
  server.use(
    http.get(`${BOOK_URL}/${path}`, ({ request }) => {
      requests.push(request.url)
      return reply()
    }),
  )
  return requests
}

function stubShelfCounts(reply: () => Response) {
  return stubBookRead('shelf-counts', reply)
}

function stubSeries(reply: () => Response) {
  return stubBookRead('series', reply)
}

function stubReader(shelf: Record<string, unknown>[] = []) {
  stubSignedIn()
  server.use(
    http.get(SHELF_URL, () => HttpResponse.json({ data: shelf })),
    http.get(`${API_URL}/me/reviews`, reviewTotal(0)),
  )
}

function renderBookPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/books/:key" element={<BookRoute />} />
    </Routes>,
    { route: `/books/${book.key}` },
  )
}

function shownStats() {
  return screen
    .queryAllByRole('term')
    .filter((term) => STAT_LABELS.includes(term.textContent))
    .map((term) => [term.textContent, term.nextElementSibling?.textContent])
}

async function expectNoStats() {
  await expect(screen.findByText('Reading now', {}, { timeout: STATS_SETTLE_MS })).rejects.toThrow()
}

async function expectNoSeriesRow() {
  await expect(
    screen.findByRole('region', { name: SERIES_ROW }, { timeout: STATS_SETTLE_MS }),
  ).rejects.toThrow()
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('BookRoute', () => {
  it('should show the four stats when counts load', async () => {
    stubBookPage(reviewTotal(1957))
    stubShelfCounts(() => HttpResponse.json({ data: { ...shelfCounts.data, finished: 20431 } }))

    renderBookPage()

    await waitFor(() =>
      expect(shownStats()).toEqual([
        ['Reviews', '1,957'],
        ['Reading now', '12'],
        ['Read', '20,431'],
        ['Want to read', '3'],
      ]),
    )
  })

  it('should show no stats when the counts fail to load', async () => {
    stubBookPage(reviewTotal(1957))
    const countRequests = stubShelfCounts(() => new HttpResponse(null, { status: SERVER_ERROR }))

    renderBookPage()
    await waitFor(() => expect(countRequests).toHaveLength(1))

    await expectNoStats()
    expect(screen.getByRole('heading', { name: book.title })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Reviews' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Discussions' })).toBeInTheDocument()
  })

  it('should show no stats when the reviews fail to load', async () => {
    stubBookPage(() => new HttpResponse(null, { status: SERVER_ERROR }))
    stubShelfCounts(() => HttpResponse.json(shelfCounts))

    renderBookPage()
    await screen.findByText('Could not load reviews. Try again later.')

    await expectNoStats()
  })

  it('should show a row for each series of the book', async () => {
    stubBookPage(reviewTotal(0))
    stubShelfCounts(() => HttpResponse.json(shelfCounts))
    stubSeries(() => HttpResponse.json({ data: [bookSeries, SUN_EATER] }))

    renderBookPage()

    const redRising = await screen.findByRole('region', { name: 'Also in Red Rising Saga' })
    expect(redRising).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Also in Sun Eater' })).toBeInTheDocument()
  })

  it('should keep the book page when the series fail to load', async () => {
    stubBookPage(reviewTotal(0))
    stubShelfCounts(() => HttpResponse.json(shelfCounts))
    const seriesRequests = stubSeries(() => new HttpResponse(null, { status: SERVER_ERROR }))

    renderBookPage()
    await waitFor(() => expect(seriesRequests).toHaveLength(1))

    await expectNoSeriesRow()
    expect(screen.getByRole('heading', { name: book.title })).toBeInTheDocument()
  })

  it('should point every series link at its search', async () => {
    const seriesBook = { ...book, series: [{ name: 'Red Rising Saga', position: 1 }] }
    stubBookPage(reviewTotal(0))
    stubShelfCounts(() => HttpResponse.json(shelfCounts))
    server.use(http.get(BOOK_URL, () => HttpResponse.json({ data: seriesBook })))

    renderBookPage()

    const seriesLinks = await screen.findAllByRole('link', { name: 'Red Rising Saga #1' })
    expect(seriesLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/search?q=Red+Rising+Saga',
      '/search?q=Red+Rising+Saga',
    ])
  })

  it('should point each author link at its search', async () => {
    stubBookPage(reviewTotal(0))
    stubShelfCounts(() => HttpResponse.json(shelfCounts))

    renderBookPage()

    const authorLink = await screen.findByRole('link', { name: 'Brian Herbert' })
    expect(authorLink).toHaveAttribute('href', '/search?q=Brian+Herbert')
  })

  it('should show the BetterReads rating', async () => {
    stubBookPage(reviewTotal(0))
    stubShelfCounts(() => HttpResponse.json(shelfCounts))
    server.use(http.get(`${BOOK_URL}/community-rating`, () => HttpResponse.json(communityRating)))

    renderBookPage()

    const community = await screen.findByRole('group', { name: 'BetterReads' })
    expect(await within(community).findByText('4.71')).toBeInTheDocument()
    expect(within(community).getByText('12 ratings')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'BetterReads ratings' })).toBeInTheDocument()
  })

  it('should say when the book has no BetterReads ratings', async () => {
    stubBookPage(reviewTotal(0))
    stubShelfCounts(() => HttpResponse.json(shelfCounts))
    const ratingRequests = stubBookRead('community-rating', () =>
      HttpResponse.json(noCommunityRating),
    )

    renderBookPage()
    await waitFor(() => expect(ratingRequests).toHaveLength(1))

    const community = await screen.findByRole('group', { name: 'BetterReads' })
    expect(await within(community).findByText('No ratings yet')).toBeInTheDocument()
    expect(within(community).queryByText(/ratings?$/)).toBeNull()
  })

  it("should stamp the facts with the reader's shelf status", async () => {
    stubBookPage(reviewTotal(0))
    stubShelfCounts(() => HttpResponse.json(shelfCounts))
    stubReader()
    server.use(
      http.put(`${SHELF_URL}/${book.key}/status`, () => HttpResponse.json({ data: READ_ENTRY })),
    )
    const { user } = renderBookPage()
    await user.click(await screen.findByRole('button', { name: 'Choose shelf' }))

    await user.click(screen.getByRole('menuitemradio', { name: 'Read' }))

    await waitFor(() => expect(screen.getByRole('main')).toHaveTextContent(READ_STAMP))
  })

  it.each([
    { label: 'Want to read', status: 'WANT_TO_READ', stamp: /Want to read\s*Jan 5, 2026/ },
    {
      label: 'Currently reading',
      status: 'CURRENTLY_READING',
      stamp: /Currently reading\s*Jan 20, 2026/,
    },
    { label: 'Did not finish', status: 'DROPPED', stamp: /Did not finish\s*Jan 5, 2026/ },
  ])('should date a "$label" stamp', async ({ status, stamp }) => {
    stubBookPage(reviewTotal(0))
    stubShelfCounts(() => HttpResponse.json(shelfCounts))
    stubReader([{ ...DATED_ENTRY, status }])

    renderBookPage()

    await waitFor(() => expect(screen.getByRole('main')).toHaveTextContent(stamp))
  })
})
