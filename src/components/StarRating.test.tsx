import { describe, expect, it, vi } from 'vitest'

import { render, screen, userEvent } from '@/testing/test-utils'

import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('should render a static rating', () => {
    render(<StarRating value={4.71} />)

    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByLabelText('Rated 4.71 of 5')).toBeInTheDocument()
  })

  it('should report the chosen star when a reader rates', async () => {
    const user = userEvent.setup()
    const onRate = vi.fn()
    render(<StarRating value={0} onRate={onRate} />)

    await user.click(screen.getByRole('button', { name: 'Rate 4 of 5' }))

    expect(onRate).toHaveBeenCalledWith(4)
  })

  it('should mark selected stars', () => {
    render(<StarRating value={2} onRate={vi.fn()} />)

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
