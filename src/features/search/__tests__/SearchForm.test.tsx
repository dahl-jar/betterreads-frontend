import { describe, expect, it, vi } from 'vitest'

import { render, screen, userEvent } from '@/testing/test-utils'

import { SearchForm } from '../components/SearchForm'

describe('SearchForm', () => {
  it('should submit the typed query when Search is clicked', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    render(<SearchForm onSearch={onSearch} />)

    await user.type(screen.getByRole('searchbox'), 'the wheel of time')
    await user.click(screen.getByRole('button', { name: /^search$/i }))

    expect(onSearch).toHaveBeenCalledWith('the wheel of time')
  })

  it('should not submit an empty or whitespace-only query', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    render(<SearchForm onSearch={onSearch} />)

    await user.type(screen.getByRole('searchbox'), '   ')
    await user.click(screen.getByRole('button', { name: /^search$/i }))

    expect(onSearch).not.toHaveBeenCalled()
  })

  it('should update the box when browser navigation changes the initial query', () => {
    const { rerender } = render(<SearchForm onSearch={vi.fn()} initialQuery="mistborn" />)

    rerender(<SearchForm onSearch={vi.fn()} initialQuery="sun eater" />)

    expect(screen.getByRole('searchbox')).toHaveValue('sun eater')
  })

  it('should prefill the box with the initial query', () => {
    render(<SearchForm onSearch={vi.fn()} initialQuery="mistborn" />)

    expect(screen.getByRole('searchbox')).toHaveValue('mistborn')
  })
})
