import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'
import { fireEvent, renderWithProviders, screen } from '@/testing/test-utils'

import { BookListSection } from '../components/BookListSection'

import { makeCatalogCard } from './mocks/catalogCard'

const LIST_URL = 'http://localhost:8080/api/v1/books'

function card(key: string, title: string, average: number | null) {
  return makeCatalogCard({
    key,
    title,
    coverUrl: `https://covers.example/${key}.jpg`,
    averageRating: average,
    ratingCount: average === null ? null : 1_400_000,
  })
}

describe('BookListSection', () => {
  it('should show top-rated book cards', async () => {
    server.use(http.get(LIST_URL, () => HttpResponse.json({ data: [card('dune', 'Dune', 4.25)] })))

    renderWithProviders(<BookListSection />)

    const link = await screen.findByRole('link', { name: /dune/i })
    expect(link).toHaveAttribute('href', '/books/dune')
    expect(screen.getByText(/4\.3/)).toBeInTheDocument()
    expect(screen.getByText(/1,400,000 ratings/)).toBeInTheDocument()
  })

  it('should refetch the other list when its tab is selected', async () => {
    const requested: string[] = []
    server.use(
      http.get(LIST_URL, ({ request }) => {
        const list = new URL(request.url).searchParams.get('list') ?? ''
        requested.push(list)
        const title = list === 'TOP_RATED' ? 'Top Book' : 'New Book'
        return HttpResponse.json({ data: [card(list, title, 4.0)] })
      }),
    )

    const { user } = renderWithProviders(<BookListSection />)
    await screen.findByText('Top Book')

    await user.click(screen.getByRole('tab', { name: /recently added/i }))

    await screen.findByText('New Book')
    expect(requested).toContain('RECENTLY_ADDED')
  })

  it('should omit the rating line for a card with no rating', async () => {
    server.use(
      http.get(LIST_URL, () => HttpResponse.json({ data: [card('sparse', 'Brand New', null)] })),
    )

    renderWithProviders(<BookListSection />)

    await screen.findByText('Brand New')
    expect(screen.queryByText(/ratings/)).not.toBeInTheDocument()
  })

  it('should scroll the strip forward when next is clicked', async () => {
    server.use(
      http.get(LIST_URL, () =>
        HttpResponse.json({ data: [card('a', 'Alpha', 4.0), card('b', 'Bravo', 4.0)] }),
      ),
    )

    const { user } = renderWithProviders(<BookListSection />)
    await screen.findByText('Alpha')
    const strip = screen.getByTestId('carousel-strip')
    Object.defineProperty(strip, 'clientWidth', { value: 600, configurable: true })
    Object.defineProperty(strip, 'scrollWidth', { value: 2000, configurable: true })
    let scrollArg: ScrollToOptions | undefined
    Object.defineProperty(strip, 'scrollBy', {
      configurable: true,
      value: (options?: number | ScrollToOptions) => {
        scrollArg = typeof options === 'object' ? options : undefined
      },
    })
    fireEvent.scroll(strip)

    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(scrollArg?.left ?? 0).toBeGreaterThan(0)
  })

  it('should disable previous at the start of the strip', async () => {
    server.use(
      http.get(LIST_URL, () =>
        HttpResponse.json({ data: [card('a', 'Alpha', 4.0), card('b', 'Bravo', 4.0)] }),
      ),
    )

    renderWithProviders(<BookListSection />)
    await screen.findByText('Alpha')

    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
  })
})
