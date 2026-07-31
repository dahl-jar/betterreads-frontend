import { afterEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn, stubSignedOut } from '@/testing/authHandlers'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { Header } from './Header'

function renderHeader() {
  return renderWithProviders(<Header />)
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('Header', () => {
  it('should show anonymous navigation', async () => {
    stubSignedOut()

    renderHeader()

    await waitFor(() => expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
  })

  it('should show authenticated navigation', async () => {
    stubSignedIn()

    renderHeader()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /account menu/i })).toBeInTheDocument(),
    )
    expect(screen.getByRole('link', { name: /my books/i })).toBeInTheDocument()
  })
})
