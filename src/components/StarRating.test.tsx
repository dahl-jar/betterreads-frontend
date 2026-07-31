import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders, screen } from '@/testing/test-utils'

import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('should render a static rating', () => {
    renderWithProviders(<StarRating value={3} />)

    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByLabelText('Rated 3 of 5')).toBeInTheDocument()
  })

  it('should report the chosen star when a reader rates', async () => {
    const onRate = vi.fn()
    const { user } = renderWithProviders(<StarRating value={0} onRate={onRate} />)

    await user.click(screen.getByRole('button', { name: 'Rate 4 of 5' }))

    expect(onRate).toHaveBeenCalledWith(4)
  })

  it('should mark selected stars', () => {
    renderWithProviders(<StarRating value={2} onRate={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Rate 1 of 5' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Rate 3 of 5' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
