import { describe, expect, it } from 'vitest'

import { render, screen } from '@/testing/test-utils'

import { type CommunityRating } from '../api/getCommunityRating'
import { CommunityRatingSummary } from '../components/CommunityRatingSummary'

const rated: CommunityRating = {
  average: 4.0,
  count: 4,
  distribution: [
    { star: 5, count: 2 },
    { star: 4, count: 1 },
    { star: 3, count: 1 },
    { star: 2, count: 0 },
    { star: 1, count: 0 },
  ],
}

describe('CommunityRatingSummary', () => {
  it('should show the rating summary', () => {
    render(<CommunityRatingSummary rating={rated} />)

    expect(screen.getByText('4.00')).toBeInTheDocument()
    expect(screen.getByText('4 ratings')).toBeInTheDocument()
    expect(screen.getByText('2 (50%)')).toBeInTheDocument()
    expect(screen.getAllByText('1 (25%)')).toHaveLength(2)
    expect(screen.getAllByText('0 (0%)')).toHaveLength(2)
  })

  it('should render nothing when the book has no community ratings', () => {
    const unrated: CommunityRating = {
      average: null,
      count: 0,
      distribution: rated.distribution.map((bucket) => ({ ...bucket, count: 0 })),
    }

    const { container } = render(<CommunityRatingSummary rating={unrated} />)

    expect(container).toBeEmptyDOMElement()
  })
})
