import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { stubSignedOut } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor, within } from '@/testing/test-utils'

import { ShelfList } from '../components/ShelfList'

import shelfEntry from './mocks/shelf-entry.json'

const SHELF_URL = 'http://localhost:8080/api/v1/me/books'
const SHELF_PAGE_SIZE = 15

function entry(key: string, title: string, status: string) {
  return { ...shelfEntry, key, title, status, averageRating: null }
}

function entries(count: number, status = 'FINISHED') {
  return Array.from({ length: count }, (_, index) => {
    const bookNumber = index + 1
    return entry(`OL${bookNumber}W`, `Book ${bookNumber}`, status)
  })
}

beforeEach(() => {
  stubSignedOut()
})

describe('ShelfList', () => {
  it('should render the shelved books once loaded', async () => {
    server.use(
      http.get(SHELF_URL, () =>
        HttpResponse.json({
          data: [
            entry('OL1W', 'Dune', 'CURRENTLY_READING'),
            entry('OL2W', 'The Hobbit', 'FINISHED'),
          ],
        }),
      ),
    )

    renderWithProviders(<ShelfList />)

    expect(await screen.findByRole('link', { name: /dune/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /the hobbit/i })).toBeInTheDocument()
  })

  it('should keep a cover decorative inside its book link', async () => {
    server.use(
      http.get(SHELF_URL, () =>
        HttpResponse.json({
          data: [
            {
              ...entry('OL1W', 'Dune', 'CURRENTLY_READING'),
              coverUrl: 'https://covers.example/dune.jpg',
            },
          ],
        }),
      ),
    )

    renderWithProviders(<ShelfList />)

    const link = await screen.findByRole('link', { name: /dune/i })
    expect(link.querySelector('img')).toHaveAttribute('alt', '')
  })

  it('should name a favorite book without exposing the star glyph', async () => {
    server.use(
      http.get(SHELF_URL, () =>
        HttpResponse.json({
          data: [{ ...entry('OL1W', 'Dune', 'CURRENTLY_READING'), favorite: true }],
        }),
      ),
    )

    renderWithProviders(<ShelfList />)

    const link = await screen.findByRole('link', { name: /dune.*favorite|favorite.*dune/i })
    expect(within(link).getByText('★')).toHaveAttribute('aria-hidden', 'true')
  })

  it('should paginate the shelf', async () => {
    server.use(http.get(SHELF_URL, () => HttpResponse.json({ data: entries(SHELF_PAGE_SIZE + 1) })))
    const { user } = renderWithProviders(<ShelfList />)

    expect(await screen.findByRole('link', { name: /book 1\b/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /book 15\b/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /book 16\b/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(screen.getByRole('link', { name: /book 16\b/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /book 1\b/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled()
  })

  it('should reset pagination after filtering', async () => {
    server.use(
      http.get(SHELF_URL, ({ request }) => {
        const status = new URL(request.url).searchParams.get('status')
        if (status === 'WANT_TO_READ') {
          return HttpResponse.json({ data: entries(1, 'WANT_TO_READ') })
        }
        return HttpResponse.json({ data: entries(SHELF_PAGE_SIZE + 1) })
      }),
    )
    const { user } = renderWithProviders(<ShelfList />)
    await screen.findByRole('link', { name: /book 1\b/i })
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByRole('link', { name: /book 16\b/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /want to read/i }))

    expect(await screen.findByRole('link', { name: /book 1\b/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument()
  })

  it('should refetch with a status filter when one is selected', async () => {
    let receivedStatus: string | null = null
    server.use(
      http.get(SHELF_URL, ({ request }) => {
        receivedStatus = new URL(request.url).searchParams.get('status')
        const all = [
          entry('OL1W', 'Dune', 'CURRENTLY_READING'),
          entry('OL2W', 'The Hobbit', 'FINISHED'),
        ]
        const filtered = receivedStatus ? all.filter((e) => e.status === receivedStatus) : all
        return HttpResponse.json({ data: filtered })
      }),
    )
    const { user } = renderWithProviders(<ShelfList />)
    await screen.findByRole('link', { name: /dune/i })

    await user.click(screen.getByRole('button', { name: /^finished$/i }))

    await waitFor(() => expect(receivedStatus).toBe('FINISHED'))
    expect(await screen.findByRole('link', { name: /the hobbit/i })).toBeInTheDocument()
  })

  it('should show an empty message when the shelf has no books', async () => {
    server.use(http.get(SHELF_URL, () => HttpResponse.json({ data: [] })))

    renderWithProviders(<ShelfList />)

    expect(await screen.findByText(/no books/i)).toBeInTheDocument()
  })

  it('should show an error message when the shelf fails to load', async () => {
    server.use(http.get(SHELF_URL, () => new HttpResponse(null, { status: 500 })))

    renderWithProviders(<ShelfList />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('should show shelf metadata when present', async () => {
    server.use(
      http.get(SHELF_URL, () =>
        HttpResponse.json({
          data: [
            {
              key: 'OL2W',
              title: 'The Hobbit',
              authors: ['J. R. R. Tolkien'],
              status: 'FINISHED',
              favorite: false,
              addedAt: '2026-01-02',
              finishedAt: '2026-02-14',
              averageRating: 4.27,
              myRating: 5,
            },
          ],
        }),
      ),
    )

    renderWithProviders(<ShelfList />)
    await screen.findByRole('link', { name: /the hobbit/i })

    expect(screen.getByText('Added Jan 2, 2026')).toBeInTheDocument()
    expect(screen.getByText('Read Feb 14, 2026')).toBeInTheDocument()
    expect(screen.getByText(/4\.27/)).toBeInTheDocument()
    expect(screen.getByLabelText(/your rating: 5/i)).toBeInTheDocument()
  })

  it('should omit finished dates for unfinished books', async () => {
    server.use(
      http.get(SHELF_URL, () =>
        HttpResponse.json({
          data: [
            {
              key: 'OL1W',
              title: 'Dune',
              authors: ['Frank Herbert'],
              status: 'CURRENTLY_READING',
              favorite: false,
              addedAt: '2026-01-02',
            },
          ],
        }),
      ),
    )

    renderWithProviders(<ShelfList />)
    await screen.findByRole('link', { name: /dune/i })

    expect(screen.queryByText(/read [A-Z]/)).not.toBeInTheDocument()
  })
})
