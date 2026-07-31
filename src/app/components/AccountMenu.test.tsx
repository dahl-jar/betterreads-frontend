import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { AccountMenu } from './AccountMenu'

const BASE = 'http://localhost:8080/api/v1/auth'

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('AccountMenu', () => {
  it('should open the account menu', async () => {
    stubSignedIn()
    const { user } = renderWithProviders(<AccountMenu username="darrow" />)

    await user.click(await screen.findByRole('button', { name: /account menu/i }))

    expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /log out/i })).toBeInTheDocument()
  })

  it('should log out when log out is chosen', async () => {
    stubSignedIn()
    let loggedOut = false
    server.use(
      http.post(`${BASE}/logout`, () => {
        loggedOut = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderWithProviders(<AccountMenu username="darrow" />)

    await user.click(await screen.findByRole('button', { name: /account menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /log out/i }))

    await waitFor(() => expect(loggedOut).toBe(true))
  })

  it('should close the menu on escape', async () => {
    stubSignedIn()
    const { user } = renderWithProviders(<AccountMenu username="darrow" />)

    await user.click(await screen.findByRole('button', { name: /account menu/i }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menuitem', { name: /log out/i })).toBeNull()
  })

  it('should close the menu when the drawer backdrop is tapped', async () => {
    stubSignedIn()
    const { user } = renderWithProviders(<AccountMenu username="darrow" />)

    await user.click(await screen.findByRole('button', { name: /account menu/i }))
    await user.click(screen.getByTestId('account-menu-backdrop'))

    expect(screen.queryByRole('menuitem', { name: /log out/i })).toBeNull()
  })
})
