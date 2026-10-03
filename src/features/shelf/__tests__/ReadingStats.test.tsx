import { beforeEach, describe, expect, it } from 'vitest'

import { bookPath } from '@/lib/bookPath'
import { stubSignedOut } from '@/testing/authHandlers'
import { DARK_AGE, GOLDEN_SON, IRON_GOLD, MORNING_STAR, RED_RISING } from '@/testing/readingHistory'
import { renderWithProviders, screen } from '@/testing/test-utils'

import { type ShelfEntry } from '../api/shelfSchemas'
import { ReadingStats } from '../components/ReadingStats'

const TODAY = '2026-06-15'

const SHELF = [MORNING_STAR, GOLDEN_SON, IRON_GOLD, RED_RISING, DARK_AGE]
const TITLES = SHELF.map((entry) => entry.title)

function listedTitles() {
  return screen
    .getAllByRole('listitem')
    .map((item) => TITLES.find((title) => item.textContent?.startsWith(title)))
    .filter((title) => title !== undefined)
}

async function openYearView(entries: ShelfEntry[]) {
  const { user } = renderWithProviders(<ReadingStats entries={entries} today={TODAY} />)
  await user.click(screen.getByRole('button', { name: 'Year' }))
}

beforeEach(stubSignedOut)

describe('ReadingStats', () => {
  it('should count the books finished this year', () => {
    renderWithProviders(<ReadingStats entries={SHELF} today={TODAY} />)

    expect(screen.getByText('Read in 2026')).toBeInTheDocument()
    expect(screen.getByText('books so far this year').parentElement).toHaveTextContent(
      /3\s*books so far this year/,
    )
  })

  it("should list this month's finished books", () => {
    renderWithProviders(<ReadingStats entries={SHELF} today={TODAY} />)

    expect(screen.getByText('Finished in June · 2')).toBeInTheDocument()
    expect(listedTitles()).toEqual(['Red Rising', 'Golden Son'])
  })

  it('should step to the previous month', async () => {
    const { user } = renderWithProviders(<ReadingStats entries={SHELF} today={TODAY} />)

    await user.click(screen.getByRole('button', { name: 'Previous month' }))

    expect(screen.getByText('May 2026')).toBeInTheDocument()
    expect(screen.getByText('Finished in May · 1')).toBeInTheDocument()
    expect(listedTitles()).toEqual(['Morning Star'])
  })

  it('should step from January back to December of the year before', async () => {
    const shelf = [{ ...IRON_GOLD, finishedAt: '2025-12-20' }]
    const { user } = renderWithProviders(<ReadingStats entries={shelf} today="2026-01-15" />)

    await user.click(screen.getByRole('button', { name: 'Previous month' }))

    expect(screen.getByText('December 2025')).toBeInTheDocument()
    expect(screen.getByText('Finished in December 2025 · 1')).toBeInTheDocument()
    expect(listedTitles()).toEqual(['Iron Gold'])
    expect(screen.getByRole('link', { name: 'Iron Gold' })).toHaveAttribute(
      'href',
      bookPath(IRON_GOLD.key),
    )
  })

  it('should link a reading day to its first book', () => {
    const sameDay = { ...GOLDEN_SON, finishedAt: RED_RISING.finishedAt }

    renderWithProviders(<ReadingStats entries={[RED_RISING, sameDay]} today={TODAY} />)

    const day = screen.getByRole('link', { name: 'Red Rising, Golden Son' })
    expect(day).toHaveAttribute('href', bookPath(RED_RISING.key))
    expect(day).toHaveTextContent('+1')
  })

  it('should list the whole year in the year view', async () => {
    await openYearView(SHELF)

    expect(screen.getByRole('button', { name: 'Year' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Finished in 2026 · 3')).toBeInTheDocument()
    expect(listedTitles()).toEqual(['Golden Son', 'Red Rising', 'Morning Star'])
  })

  it('should label each day of the year view with its finished count', async () => {
    await openYearView(SHELF)

    expect(screen.getByTitle('Jun 5, 2026: 1 book finished')).toBeInTheDocument()
  })

  it('should shade a past day with a finished book in the year view', async () => {
    await openYearView(SHELF)

    expect(screen.getByTitle('Jun 5, 2026: 1 book finished').className).not.toBe(
      screen.getByTitle('Jun 6, 2026: 0 books finished').className,
    )
  })

  it('should not shade a future day by its count in the year view', async () => {
    const future = { ...RED_RISING, finishedAt: '2026-07-01' }

    await openYearView([future])

    expect(screen.getByTitle('Jul 1, 2026: 1 book finished').className).toBe(
      screen.getByTitle('Jul 2, 2026: 0 books finished').className,
    )
  })

  it('should show an empty month after stepping forward', async () => {
    const { user } = renderWithProviders(<ReadingStats entries={SHELF} today={TODAY} />)

    await user.click(screen.getByRole('button', { name: 'Next month' }))

    expect(screen.getByText('July 2026')).toBeInTheDocument()
    expect(screen.getByText('Finished in July')).toBeInTheDocument()
    expect(screen.getByText('No books finished in July.')).toBeInTheDocument()
  })
})
