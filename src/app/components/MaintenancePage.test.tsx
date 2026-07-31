import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MaintenancePage } from './MaintenancePage'

describe('MaintenancePage', () => {
  it('should retry the backend check', async () => {
    const onRetry = vi.fn()
    render(<MaintenancePage onRetry={onRetry} />)

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
