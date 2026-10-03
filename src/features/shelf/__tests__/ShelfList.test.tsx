import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn } from '@/testing/authHandlers'
import { holdResponse } from '@/testing/holdResponse'
import shelfEntry from '@/testing/mocks/shelf-entry.json'
import { server } from '@/testing/msw-server'
import { GOLDEN_SON, MORNING_STAR, RED_RISING } from '@/testing/readingHistory'
import { act, renderWithProviders, screen, waitFor, within } from '@/testing/test-utils'

import { ShelfList } from '../components/ShelfList'

const SHELF_URL = 'http://localhost:8080/api/v1/me/books'
const SHELF_PAGE_SIZE = 15
const SETTLE_MS = 200

const DUNE = shelfEntry
const FAVORITE_READ = { ...RED_RISING, favorite: true, addedAt: '2026-02-01', myRating: 5 }
const EARLIER_READ = { ...GOLDEN_SON, addedAt: '2026-01-15', myRating: 3 }
const BEING_READ = {
  ...MORNING_STAR,
  status: 'CURRENTLY_READING',
  addedAt: '2026-05-30',
  startedAt: '2026-06-01',
  finishedAt: null,
  myRating: 2,
}
const SHELF = [DUNE, FAVORITE_READ, EARLIER_READ, BEING_READ]
const NO_MATCH = 'tolkien'
const failingRating = () => vi.fn(() => Promise.reject(new Error('rating failed')))
const TITLES = SHELF.map((entry) => entry.title)

function entries(count: number, status = 'FINISHED') {
  return Array.from({ length: count }, (_, index) => {
    const bookNumber = index + 1
    return { ...shelfEntry, key: `OL${bookNumber}0W`, title: `Book ${bookNumber}`, status }
  })
}

function stubShelf(shelf: Record<string, unknown>[] = SHELF) {
  const requests = { count: 0 }
  server.use(
    http.get(SHELF_URL, () => {
      requests.count += 1
      return HttpResponse.json({ data: shelf })
    }),
  )
  return requests
}

function renderShelfList(onRate = vi.fn(() => Promise.resolve())) {
  return { onRate, ...renderWithProviders(<ShelfList onRate={onRate} />) }
}

function shownTitles() {
  return screen
    .getAllByRole('link')
    .map((link) => TITLES.find((title) => link.textContent?.startsWith(title)))
    .filter((title) => title !== undefined)
}

function rowOf(title: string) {
  const row = screen
    .getAllByRole('listitem')
    .find((item) => within(item).queryByRole('link', { name: title }) !== null)
  if (row === undefined) {
    throw new Error(`No row for ${title}`)
  }
  return within(row)
}

function firstOf<T>(elements: T[]): T {
  const [element] = elements
  if (element === undefined) {
    throw new Error('No matching element')
  }
  return element
}

function stubDuneFinished() {
  server.use(
    http.put(`${SHELF_URL}/${DUNE.key}/status`, () =>
      HttpResponse.json({ data: { ...DUNE, status: 'FINISHED', finishedAt: '2026-06-10' } }),
    ),
  )
}

async function moveDuneToRead(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.click(firstOf(rowOf('Dune').getAllByRole('button', { name: 'Want to read' })))
  await user.click(screen.getByRole('menuitemradio', { name: 'Read' }))
  await waitFor(() =>
    expect(firstOf(rowOf('Dune').getAllByRole('button', { name: 'Read' }))).toBeEnabled(),
  )
}

function stubRemoval(key: string) {
  server.use(http.delete(`${SHELF_URL}/${key}`, () => new HttpResponse(null, { status: 204 })))
}

async function removeRow(
  user: ReturnType<typeof renderWithProviders>['user'],
  title: string,
  status: string,
) {
  await user.click(firstOf(rowOf(title).getAllByRole('button', { name: status })))
  await user.click(screen.getByRole('menuitem', { name: 'Remove from shelf' }))
}

function rail() {
  return within(screen.getByRole('navigation', { name: 'Shelves' }))
}

async function renderLoadedShelf(
  shelf: Record<string, unknown>[] = SHELF,
  onRate?: Parameters<typeof renderShelfList>[0],
) {
  const requests = stubShelf(shelf)
  const rendered = renderShelfList(onRate)
  await screen.findByRole('link', { name: String(shelf[0]?.title) })
  return { ...rendered, requests }
}

async function openReadShelf() {
  const rendered = await renderLoadedShelf()
  await rendered.user.click(rail().getByRole('button', { name: /^Read\b/ }))
  return rendered
}

async function openSecondPage() {
  const rendered = await renderLoadedShelf(entries(SHELF_PAGE_SIZE + 1))
  await rendered.user.click(screen.getByRole('button', { name: 'Next' }))
  return rendered
}

async function searchWithoutMatches() {
  const rendered = await renderLoadedShelf()
  await rendered.user.type(searchField(), NO_MATCH)
  return rendered
}

function searchField() {
  return screen.getByRole('searchbox', { name: 'Search my books by title or author' })
}

beforeEach(() => {
  stubSignedIn()
})

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('ShelfList', () => {
  it('should render the shelved books once loaded', async () => {
    stubShelf()

    renderShelfList()

    expect(await screen.findByRole('link', { name: 'Dune' })).toHaveAttribute(
      'href',
      '/books/OL893415W',
    )
    expect(screen.getByRole('link', { name: 'Red Rising' })).toBeInTheDocument()
  })

  it('should mark a favorite book in its row', async () => {
    await renderLoadedShelf([FAVORITE_READ])

    expect(rowOf('Red Rising').getByText('Favorite')).toBeInTheDocument()
  })

  it('should filter by shelf in the rail without a new request', async () => {
    const { user, requests } = await renderLoadedShelf()

    await user.click(rail().getByRole('button', { name: /^Read\b/ }))

    expect(shownTitles()).toEqual(['Red Rising', 'Golden Son'])
    expect(screen.getByText('2 books')).toBeInTheDocument()
    expect(requests.count).toBe(1)
  })

  it.each([
    ['Title', ['Dune', 'Golden Son']],
    ['Your rating', ['Red Rising', 'Golden Son']],
    ['Date read', ['Golden Son', 'Red Rising']],
  ])('should sort by %s', async (sortLabel, firstTwoTitles) => {
    const { user } = await renderLoadedShelf()
    await user.click(screen.getByRole('button', { name: /sort by/i }))

    await user.click(screen.getByRole('menuitemradio', { name: sortLabel }))

    expect(shownTitles().slice(0, 2)).toEqual(firstTwoTitles)
  })

  it('should return focus to Sort by on Escape', async () => {
    const { user } = await renderLoadedShelf()
    const sortButton = screen.getByRole('button', { name: /sort by/i })
    await user.click(sortButton)
    await user.tab()
    expect(screen.getAllByRole('menuitemradio')[0]).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(sortButton).toHaveFocus()
  })

  it('should show favorites under Favorites', async () => {
    const { user } = await renderLoadedShelf()

    await user.click(rail().getByRole('button', { name: /^Favorites\b/ }))

    expect(shownTitles()).toEqual(['Red Rising'])
  })

  it('should show a rating saved from a row', async () => {
    const { user, onRate } = await renderLoadedShelf()

    await user.click(firstOf(rowOf('Dune').getAllByRole('button', { name: 'Rate 4 of 5' })))

    expect(onRate).toHaveBeenCalledWith(DUNE.key, 4)
    await waitFor(() =>
      expect(
        firstOf(rowOf('Dune').getAllByRole('button', { name: 'Rate 4 of 5' })),
      ).toHaveAttribute('aria-pressed', 'true'),
    )
  })

  it('should restore the old rating when saving fails', async () => {
    const { user } = await renderLoadedShelf(SHELF, failingRating())

    await user.click(firstOf(rowOf('Golden Son').getAllByRole('button', { name: 'Rate 5 of 5' })))

    expect(await screen.findByText('Could not save your rating. Try again.')).toBeInTheDocument()
    expect(
      firstOf(rowOf('Golden Son').getAllByRole('button', { name: 'Rate 5 of 5' })),
    ).toHaveAttribute('aria-pressed', 'false')
    expect(
      firstOf(rowOf('Golden Son').getAllByRole('button', { name: 'Rate 3 of 5' })),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('should move a book to Read from its row without loading the shelf again', async () => {
    stubDuneFinished()
    const { user, requests } = await renderLoadedShelf()

    await moveDuneToRead(user)

    expect(rail().getByRole('button', { name: /^Read\b/ })).toHaveTextContent('3')
    expect(requests.count).toBe(1)
  })

  it('should keep a new status when a rating saved earlier finishes', async () => {
    stubDuneFinished()
    const rating = holdResponse()
    const onRate = vi.fn(() => rating.held)
    const { user } = await renderLoadedShelf(SHELF, onRate)
    await user.click(firstOf(rowOf('Dune').getAllByRole('button', { name: 'Rate 4 of 5' })))
    await moveDuneToRead(user)

    await act(async () => {
      rating.release()
      await rating.held
    })

    expect(onRate).toHaveBeenCalledTimes(1)
    expect(firstOf(rowOf('Dune').getAllByRole('button', { name: 'Rate 4 of 5' }))).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(firstOf(rowOf('Dune').getAllByRole('button', { name: 'Read' }))).toBeInTheDocument()
    expect(rail().getByRole('button', { name: /^Read\b/ })).toHaveTextContent('3')
  })

  it('should drop a book removed from its row', async () => {
    stubRemoval(FAVORITE_READ.key)
    const { user, requests } = await renderLoadedShelf()

    await removeRow(user, 'Red Rising', 'Read')

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Red Rising' })).toBeNull())
    expect(requests.count).toBe(1)
  })

  it('should keep a removed book gone when its rating finishes saving', async () => {
    stubRemoval(FAVORITE_READ.key)
    const rating = holdResponse()
    const { user } = await renderLoadedShelf(
      SHELF,
      vi.fn(() => rating.held),
    )
    await user.click(firstOf(rowOf('Red Rising').getAllByRole('button', { name: 'Rate 4 of 5' })))
    await removeRow(user, 'Red Rising', 'Read')
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Red Rising' })).toBeNull())

    rating.release()

    await expect(
      waitFor(() => expect(screen.getByRole('link', { name: 'Red Rising' })).toBeInTheDocument(), {
        timeout: SETTLE_MS,
      }),
    ).rejects.toThrow()
  })

  it('should switch to cover view', async () => {
    const { user } = await renderLoadedShelf([DUNE])

    await user.click(screen.getByRole('button', { name: 'Cover view' }))

    expect(screen.getByRole('button', { name: 'Cover view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('link', { name: /Dune.*Frank Herbert/ })).toBeInTheDocument()
  })

  it('should say when a rating from a cover fails to save', async () => {
    const { user } = await renderLoadedShelf([DUNE], failingRating())
    await user.click(screen.getByRole('button', { name: 'Cover view' }))

    await user.click(screen.getByRole('button', { name: 'Rate 4 of 5' }))

    expect(await screen.findByText('Could not save your rating. Try again.')).toBeInTheDocument()
  })

  it('should show the 16th book on the next page', async () => {
    stubShelf(entries(SHELF_PAGE_SIZE + 1))
    const { user } = renderShelfList()

    expect(await screen.findByRole('link', { name: 'Book 1' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Book 15' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Book 16' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByRole('link', { name: 'Book 16' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Book 1' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled()
  })

  it('should go back to the first page after changing shelf', async () => {
    const { user } = await openSecondPage()
    expect(screen.getByRole('link', { name: 'Book 16' })).toBeInTheDocument()

    await user.click(rail().getByRole('button', { name: /^Read\b/ }))

    expect(screen.getByRole('link', { name: 'Book 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })

  it('should show the last full page after removing the only book on a page', async () => {
    stubRemoval('OL160W')
    const { user } = await openSecondPage()
    await user.click(firstOf(rowOf('Book 16').getAllByRole('button', { name: 'Read' })))

    await user.click(screen.getByRole('menuitem', { name: 'Remove from shelf' }))

    expect(await screen.findByRole('link', { name: 'Book 1' })).toBeInTheDocument()
  })

  it('should drop a book removed after a status change', async () => {
    stubDuneFinished()
    stubRemoval(DUNE.key)
    const { user } = await renderLoadedShelf()
    await moveDuneToRead(user)
    await user.click(firstOf(rowOf('Dune').getAllByRole('button', { name: 'Read' })))

    await user.click(screen.getByRole('menuitem', { name: 'Remove from shelf' }))

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Dune' })).toBeNull())
  })

  it('should show a rating while it saves', async () => {
    const rating = holdResponse()
    const { user } = await renderLoadedShelf(
      SHELF,
      vi.fn(() => rating.held),
    )

    await user.click(firstOf(rowOf('Dune').getAllByRole('button', { name: 'Rate 4 of 5' })))

    expect(firstOf(rowOf('Dune').getAllByRole('button', { name: 'Rate 4 of 5' }))).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('should clear the rating error after a later rating saves', async () => {
    const onRate = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('rating failed'))
      .mockResolvedValue(undefined)
    const { user } = await renderLoadedShelf(SHELF, onRate)
    await user.click(firstOf(rowOf('Dune').getAllByRole('button', { name: 'Rate 4 of 5' })))
    await screen.findByText('Could not save your rating. Try again.')

    await user.click(firstOf(rowOf('Dune').getAllByRole('button', { name: 'Rate 5 of 5' })))

    await waitFor(() =>
      expect(screen.queryByText('Could not save your rating. Try again.')).toBeNull(),
    )
  })

  it('should show only books whose title or author matches the search', async () => {
    const { user } = await renderLoadedShelf()

    await user.type(searchField(), 'herbert')

    expect(shownTitles()).toEqual(['Dune'])
    expect(screen.getByText('1 book found')).toBeInTheDocument()
  })

  it('should mark the matched words in a row', async () => {
    const { user } = await renderLoadedShelf([FAVORITE_READ])

    await user.type(searchField(), 'rising brown')

    expect(rowOf('Red Rising').getByText('Rising', { selector: 'mark' })).toBeInTheDocument()
    expect(rowOf('Red Rising').getByText('Brown', { selector: 'mark' })).toBeInTheDocument()
  })

  it('should mark the matched words in a cover', async () => {
    const { user } = await renderLoadedShelf([FAVORITE_READ])
    await user.click(screen.getByRole('button', { name: 'Cover view' }))

    await user.type(searchField(), 'rising brown')

    expect(screen.getByText('Rising', { selector: 'mark' })).toBeInTheDocument()
    expect(screen.getByText('Brown', { selector: 'mark' })).toBeInTheDocument()
  })

  it('should search within the open shelf', async () => {
    const { user } = await openReadShelf()

    await user.type(searchField(), 'brown')

    expect(shownTitles()).toEqual(['Red Rising', 'Golden Son'])
  })

  it('should keep the search after changing shelf', async () => {
    const { user } = await renderLoadedShelf()
    await user.type(searchField(), 'brown')

    await user.click(rail().getByRole('button', { name: /^Read\b/ }))

    expect(shownTitles()).toEqual(['Red Rising', 'Golden Son'])
  })

  it('should go back to the first page after searching', async () => {
    const { user } = await openSecondPage()

    await user.type(searchField(), 'book')

    expect(screen.getByRole('link', { name: 'Book 1' })).toBeInTheDocument()
  })

  it('should say no books match the search', async () => {
    await searchWithoutMatches()

    expect(screen.getByText(/No books match/)).toHaveTextContent(`No books match “${NO_MATCH}”.`)
  })

  it('should find a book on another shelf from the no match message', async () => {
    const { user } = await openReadShelf()
    await user.type(searchField(), 'dune')

    await user.click(screen.getByRole('button', { name: 'All books' }))

    expect(shownTitles()).toEqual(['Dune'])
  })

  it('should clear the search with the clear button', async () => {
    const { user } = await searchWithoutMatches()

    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(screen.getByRole('link', { name: 'Dune' })).toBeInTheDocument()
    expect(searchField()).toHaveValue('')
    expect(searchField()).toHaveFocus()
  })

  it('should clear the search on Escape', async () => {
    const { user } = await searchWithoutMatches()

    await user.keyboard('{Escape}')

    expect(screen.getByRole('link', { name: 'Dune' })).toBeInTheDocument()
  })

  it('should show an empty message when the shelf has no books', async () => {
    stubShelf([])

    renderShelfList()

    expect(await screen.findByText('No books on this shelf yet.')).toBeInTheDocument()
  })

  it('should show an error message when the shelf fails to load', async () => {
    server.use(http.get(SHELF_URL, () => new HttpResponse(null, { status: 500 })))

    renderShelfList()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load your books. Reload the page.',
    )
  })

  it('should show the Hardcover average', async () => {
    await renderLoadedShelf([{ ...FAVORITE_READ, averageRating: 4.27 }])

    expect(firstOf(rowOf('Red Rising').getAllByText(/4\.27/))).toBeInTheDocument()
  })

  it('should show the start date for a book being read', async () => {
    await renderLoadedShelf([{ ...BEING_READ, finishedAt: '2026-02-14' }])

    expect(firstOf(rowOf('Morning Star').getAllByText(/Jun 1, 2026/))).toBeInTheDocument()
    expect(rowOf('Morning Star').queryByText(/Feb 14, 2026/)).toBeNull()
  })
})
