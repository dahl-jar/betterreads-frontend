import { afterEach, describe, expect, it, vi } from 'vitest'

import { CONTACT_EMAIL } from '@/app/siteLinks'
import { render, screen, userEvent } from '@/testing/test-utils'

import { ContactCard } from './ContactCard'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ContactCard', () => {
  it('should copy the address', async () => {
    const user = userEvent.setup()
    render(<ContactCard />)

    await user.click(screen.getByRole('button', { name: 'Copy address' }))

    await expect(navigator.clipboard.readText()).resolves.toBe(CONTACT_EMAIL)
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
  })

  it('should select the address when copying fails', async () => {
    const user = userEvent.setup()
    render(<ContactCard />)
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('blocked'))

    await user.click(screen.getByRole('button', { name: 'Copy address' }))

    expect(window.getSelection()?.toString()).toBe(CONTACT_EMAIL)
    expect(screen.getByRole('status')).not.toHaveTextContent('Copied')
  })
})
