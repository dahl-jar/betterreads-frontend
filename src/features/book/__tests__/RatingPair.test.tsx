import { describe, expect, it } from 'vitest'

import { render, screen, within } from '@/testing/test-utils'

import { RatingPair } from '../components/RatingPair'

const HARDCOVER = { average: 4.25, count: 1_400_000 }
const COMMUNITY = { average: 5, count: 1 }
const NO_RATINGS = 'No ratings yet'

describe('RatingPair', () => {
  it('should show each rating under its source', () => {
    render(<RatingPair hardcover={HARDCOVER} community={COMMUNITY} />)

    const hardcover = screen.getByRole('group', { name: 'Hardcover' })
    const community = screen.getByRole('group', { name: 'BetterReads' })
    expect(within(hardcover).getByText('4.25')).toBeInTheDocument()
    expect(within(hardcover).getByText('1,400,000 ratings')).toBeInTheDocument()
    expect(within(community).getByText('5')).toBeInTheDocument()
    expect(within(community).getByText('1 rating')).toBeInTheDocument()
  })

  it('should hide the count when a source has none', () => {
    render(<RatingPair hardcover={{ average: 4.25, count: 0 }} />)

    const hardcover = screen.getByRole('group', { name: 'Hardcover' })
    expect(within(hardcover).getByText('4.25')).toBeInTheDocument()
    expect(within(hardcover).queryByText(/ratings?$/)).toBeNull()
  })

  it('should say when a source has no ratings', () => {
    render(<RatingPair hardcover={HARDCOVER} />)

    const hardcover = screen.getByRole('group', { name: 'Hardcover' })
    const community = screen.getByRole('group', { name: 'BetterReads' })
    expect(within(community).getByText(NO_RATINGS)).toBeInTheDocument()
    expect(within(hardcover).queryByText(NO_RATINGS)).toBeNull()
  })
})
