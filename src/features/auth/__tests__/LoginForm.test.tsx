import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedOut } from '@/testing/authHandlers'
import { makeAuthResponse } from '@/testing/mocks/auth'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { LoginForm } from '../components/LoginForm'

const BASE = 'http://localhost:8080/api/v1/auth'

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

beforeEach(stubSignedOut)

describe('LoginForm', () => {
  it('should complete login', async () => {
    let loginBody: unknown
    server.use(
      http.post(`${BASE}/login`, async ({ request }) => {
        loginBody = await request.json()
        return HttpResponse.json({ data: makeAuthResponse({ accessToken: 'jwt-1' }) })
      }),
    )
    const onSuccess = vi.fn()
    const { user } = renderWithProviders(<LoginForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText(/email or username/i), 'darrow@example.com')
    await user.type(screen.getByLabelText(/password/i), 'opensesame')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(loginBody).toEqual({ identifier: 'darrow@example.com', password: 'opensesame' })
  })

  it('should reject wrong credentials', async () => {
    server.use(http.post(`${BASE}/login`, () => new HttpResponse(null, { status: 401 })))
    const onSuccess = vi.fn()
    const { user } = renderWithProviders(<LoginForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText(/email or username/i), 'darrow')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/incorrect|invalid|try again/i),
    )
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('should reject an empty password', async () => {
    let loginCalled = false
    server.use(
      http.post(`${BASE}/login`, () => {
        loginCalled = true
        return HttpResponse.json({ data: makeAuthResponse({ accessToken: 'jwt-1' }) })
      }),
    )
    const { user } = renderWithProviders(<LoginForm onSuccess={vi.fn()} />)

    await user.type(screen.getByLabelText(/email or username/i), 'darrow')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => expect(screen.getByText(/password is required/i)).toBeInTheDocument())
    expect(loginCalled).toBe(false)
  })
})
