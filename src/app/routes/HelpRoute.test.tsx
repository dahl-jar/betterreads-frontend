import { beforeEach, describe, expect, it } from 'vitest'

import { stubSignedOut } from '@/testing/authHandlers'
import { renderWithProviders, screen, within } from '@/testing/test-utils'

import { HelpRoute } from './HelpRoute'

const FIRST_ANSWER = /We list a book once its details are complete/
const SECOND_ANSWER = /The arrow next to it has the other shelves/

beforeEach(stubSignedOut)

describe('HelpRoute', () => {
  it('should open only the first answer', () => {
    renderWithProviders(<HelpRoute />, { route: '/help' })

    expect(screen.getByText(FIRST_ANSWER)).toBeVisible()
    expect(screen.getByText(SECOND_ANSWER)).not.toBeVisible()
  })

  it('should mark Help as the current page in the side menu', () => {
    renderWithProviders(<HelpRoute />, { route: '/help' })

    const nav = within(screen.getByRole('navigation', { name: 'About and legal' }))
    expect(nav.getByRole('link', { name: 'Help' })).toHaveAttribute('aria-current', 'page')
    expect(nav.getByRole('link', { name: 'About' })).not.toHaveAttribute('aria-current')
  })
})
