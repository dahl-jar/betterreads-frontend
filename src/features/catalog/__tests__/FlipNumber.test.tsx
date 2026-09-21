import { describe, expect, it } from 'vitest'

import { render, screen } from '@/testing/test-utils'

import { FlipNumber } from '../components/FlipNumber'

describe('FlipNumber', () => {
  it('should render the formatted value without flipping on first render', () => {
    const { container } = render(<FlipNumber value={18_712} />)

    expect(screen.getByLabelText('18,712')).toHaveTextContent('18,712')
    expect(container.querySelector('[data-flip="true"]')).toBeNull()
  })

  it('should flip only the digits that changed', () => {
    const { container, rerender } = render(<FlipNumber value={18_712} />)

    rerender(<FlipNumber value={18_723} />)

    const flipping = [...container.querySelectorAll('[data-flip="true"]')].map(
      (el) => el.textContent,
    )
    expect(flipping).toEqual(['2', '3'])
  })
})
