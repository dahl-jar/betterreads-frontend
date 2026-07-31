import { describe, expect, it, vi } from 'vitest'

import { render, screen, userEvent } from '@/testing/test-utils'

import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('should render nothing when the first page has no next page', () => {
    const { container } = render(
      <Pagination page={1} hasNext={false} ariaLabel="Shelf pages" onPageChange={vi.fn()} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('should label the page navigation for its list', () => {
    render(<Pagination page={1} hasNext ariaLabel="Shelf pages" onPageChange={vi.fn()} />)

    expect(screen.getByRole('navigation', { name: /shelf pages/i })).toBeInTheDocument()
  })

  it('should move to the next page', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()
    render(<Pagination page={2} hasNext ariaLabel="Shelf pages" onPageChange={onPageChange} />)

    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('should disable next on the last page', () => {
    render(<Pagination page={3} hasNext={false} ariaLabel="Shelf pages" onPageChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled()
  })
})
