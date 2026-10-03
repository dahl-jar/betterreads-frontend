import { http, HttpResponse } from 'msw'
import { type ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { AccountMenu } from './AccountMenu'

const BASE = 'http://localhost:8080/api/v1/auth'

type User = ReturnType<typeof renderWithProviders>['user']

async function openMenu(ui: ReactElement = <AccountMenu username="user" />) {
  const rendered = renderWithProviders(ui)
  await rendered.user.click(await screen.findByRole('button', { name: /account menu/i }))
  return rendered
}

beforeEach(stubSignedIn)

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('AccountMenu', () => {
  it('should link each menu row to its page', async () => {
    await openMenu(<AccountMenu username="user" displayName="User" />)

    expect(screen.getByRole('link', { name: /view your profile/i })).toHaveAttribute(
      'href',
      '/profile',
    )
    expect(screen.getByRole('menuitem', { name: 'My books' })).toHaveAttribute('href', '/shelf')
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/settings')
    expect(screen.getByRole('menuitem', { name: 'Help' })).toHaveAttribute('href', '/help')
  })

  it('should log out when log out is chosen', async () => {
    let loggedOut = false
    server.use(
      http.post(`${BASE}/logout`, () => {
        loggedOut = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = await openMenu()

    await user.click(screen.getByRole('menuitem', { name: /log out/i }))

    await waitFor(() => expect(loggedOut).toBe(true))
  })

  it.each([
    [
      'a chosen row',
      (user: User) => user.click(screen.getByRole('menuitem', { name: 'Settings' })),
    ],
    ['escape', (user: User) => user.keyboard('{Escape}')],
    [
      'the Close menu button',
      (user: User) => user.click(screen.getByRole('button', { name: 'Close menu' })),
    ],
    [
      'a tap on the drawer backdrop',
      (user: User) => user.click(screen.getByTestId('account-menu-backdrop')),
    ],
  ])('should close the menu on %s', async (_trigger, close) => {
    const { user } = await openMenu()

    await close(user)

    expect(screen.queryByRole('menuitem', { name: /log out/i })).toBeNull()
  })

  it('should close the menu on a press outside it', async () => {
    const { user } = await openMenu(
      <>
        <AccountMenu username="user" />
        <p>Elsewhere on the page</p>
      </>,
    )

    await user.click(screen.getByText('Elsewhere on the page'))

    expect(screen.queryByRole('menuitem', { name: /log out/i })).toBeNull()
  })
})
