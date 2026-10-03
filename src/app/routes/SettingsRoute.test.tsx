import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn } from '@/testing/authHandlers'
import auth from '@/testing/mocks/auth.json'
import { server } from '@/testing/msw-server'
import { CURRENT_PASSWORD, NEW_PASSWORD } from '@/testing/passwords'
import { renderWithProviders, screen } from '@/testing/test-utils'

import { SettingsRoute } from './SettingsRoute'

const PASSWORD_URL = 'http://localhost:8080/api/v1/auth/me/password'
const REFRESH_URL = 'http://localhost:8080/api/v1/auth/refresh'

beforeEach(stubSignedIn)

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('SettingsRoute', () => {
  it('should show "Password changed" after a change', async () => {
    server.use(http.put(PASSWORD_URL, () => new HttpResponse(null, { status: 204 })))
    const { user } = renderWithProviders(<SettingsRoute />, { route: '/settings' })
    await user.click(await screen.findByRole('button', { name: 'Change' }))
    await user.type(screen.getByLabelText('Current password'), CURRENT_PASSWORD)
    await user.type(screen.getByLabelText('New password'), NEW_PASSWORD)
    await user.type(screen.getByLabelText('Repeat new password'), NEW_PASSWORD)

    await user.click(screen.getByRole('button', { name: 'Save password' }))

    expect(await screen.findByText('Password changed')).toBeInTheDocument()
  })

  it('should close the password form on Cancel', async () => {
    const { user } = renderWithProviders(<SettingsRoute />, { route: '/settings' })
    await user.click(await screen.findByRole('button', { name: 'Change' }))

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByLabelText('Current password')).toBeNull()
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument()
  })

  it('should mark a verified email', async () => {
    renderWithProviders(<SettingsRoute />, { route: '/settings' })

    await screen.findByText(auth.user.email)

    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('should leave an unverified email unmarked', async () => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json({ data: { ...auth, user: { ...auth.user, emailVerified: false } } }),
      ),
    )
    renderWithProviders(<SettingsRoute />, { route: '/settings' })

    await screen.findByText(auth.user.email)

    expect(screen.queryByText('Verified')).toBeNull()
  })
})
