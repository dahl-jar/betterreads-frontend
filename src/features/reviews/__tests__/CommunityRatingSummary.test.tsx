import { describe, expect, it } from 'vitest'

import noCommunityRating from '@/testing/mocks/no-community-rating.json'
import { render, screen, within } from '@/testing/test-utils'

import { type CommunityRating } from '../api/getCommunityRating'
import { CommunityRatingSummary } from '../components/CommunityRatingSummary'

const rated: CommunityRating = {
  average: 4.67,
  count: 3,
  distribution: [
    { star: 5, count: 2 },
    { star: 4, count: 1 },
    { star: 3, count: 0 },
    { star: 2, count: 0 },
    { star: 1, count: 0 },
  ],
}

describe('CommunityRatingSummary', () => {
  it('should list the stars from one up to five', () => {
    render(<CommunityRatingSummary rating={rated} />)

    const bars = screen.getAllByRole('listitem')

    expect(bars.map((bar) => bar.getAttribute('aria-label'))).toEqual([
      '1 star: 0 (0%)',
      '2 stars: 0 (0%)',
      '3 stars: 0 (0%)',
      '4 stars: 1 (33%)',
      '5 stars: 2 (67%)',
    ])
  })

  it('should show how many readers gave a star', () => {
    render(<CommunityRatingSummary rating={rated} />)

    const fiveStars = screen.getByLabelText('5 stars: 2 (67%)')
    const fourStars = screen.getByLabelText('4 stars: 1 (33%)')

    expect(within(fiveStars).getByText('2')).toBeInTheDocument()
    expect(within(fourStars).getByText('1')).toBeInTheDocument()
  })

  it('should show no number on a star nobody gave', () => {
    render(<CommunityRatingSummary rating={rated} />)

    const twoStars = screen.getByLabelText('2 stars: 0 (0%)')

    expect(twoStars).toHaveTextContent(/^$/)
  })

  it('should leave out the average and the total', () => {
    const { container } = render(<CommunityRatingSummary rating={rated} />)

    expect(container).not.toHaveTextContent('4.67')
    expect(container).not.toHaveTextContent('3 ratings')
  })

  it('should render nothing when the book has no community ratings', () => {
    const { container } = render(<CommunityRatingSummary rating={noCommunityRating.data} />)

    expect(container).toBeEmptyDOMElement()
  })
})
