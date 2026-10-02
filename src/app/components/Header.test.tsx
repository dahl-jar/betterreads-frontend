import { afterEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn, stubSignedOut } from '@/testing/authHandlers'
import { CurrentLocation } from '@/testing/CurrentLocation'
import { renderWithProviders, screen, waitFor, within } from '@/testing/test-utils'

import { Header } from './Header'

function renderHeader(route = '/') {
  return renderWithProviders(
    <>
      <Header />
      <CurrentLocation />
    </>,
    { route },
  )
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

  it('should show a search box away from the home page', () => {
    stubSignedOut()

    renderHeader('/books/OL1W')

    expect(within(screen.getByRole('banner')).getByRole('searchbox')).toBeInTheDocument()
  })

  it('should show no search box on the home page', () => {
    stubSignedOut()

    renderHeader('/')

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).toBeNull()
  })

  it('should go to the search page with the submitted query', async () => {
    stubSignedOut()
    const { user } = renderHeader('/about')
    const banner = within(screen.getByRole('banner'))

    await user.type(banner.getByRole('searchbox'), 'wheel of time')
    await user.click(banner.getByRole('button', { name: 'Search' }))

    expect(screen.getByText('/search?q=wheel+of+time')).toBeInTheDocument()
  })

  it('should hold the current query on the search page', () => {
    stubSignedOut()

    renderHeader('/search?q=dune')

    expect(within(screen.getByRole('banner')).getByRole('searchbox')).toHaveValue('dune')
  })
})
