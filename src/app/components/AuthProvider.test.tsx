import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { useAuth } from '@/hooks/useAuth'
import { apiGet, setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken, getAccessToken } from '@/lib/api/token'
import auth from '@/testing/mocks/auth.json'
import { server } from '@/testing/msw-server'

import { AuthProvider } from './AuthProvider'

const BASE = 'http://localhost:8080/api/v1/auth'

function Probe() {
  const { user, status, login, logout } = useAuth()
  const signIn = () => void login({ identifier: 'darrow', password: 'secret-12' })
  const signOut = () => void logout().catch(() => undefined)
  const loadProtected = () =>
    void Promise.allSettled([apiGet('/api/v1/auth/me'), apiGet('/api/v1/auth/me')])
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.username ?? 'none'}</span>
      <button onClick={signIn}>sign in</button>
      <button onClick={signOut}>sign out</button>
      <button onClick={loadProtected}>load protected</button>
    </div>
  )
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('AuthProvider', () => {
  it('should recover a valid session', async () => {
    server.use(
      http.post(`${BASE}/refresh`, () =>
        HttpResponse.json({ data: { ...auth, accessToken: 'jwt-1' } }),
      ),
    )

    renderWithAuth()

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('darrow'))
    expect(getAccessToken()).toBe('jwt-1')
  })

  it('should become anonymous without a session', async () => {
    server.use(http.post(`${BASE}/refresh`, () => new HttpResponse(null, { status: 401 })))

    renderWithAuth()

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })

  it('should store the session after login', async () => {
    server.use(
      http.post(`${BASE}/refresh`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/login`, () =>
        HttpResponse.json({
          data: { ...auth, accessToken: 'jwt-2', user: { ...auth.user, emailVerified: false } },
        }),
      ),
    )
    renderWithAuth()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))

    await userEvent.click(screen.getByRole('button', { name: 'sign in' }))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('darrow'))
    expect(getAccessToken()).toBe('jwt-2')
  })

  it('should clear the session after logout', async () => {
    server.use(
      http.post(`${BASE}/refresh`, () =>
        HttpResponse.json({ data: { ...auth, accessToken: 'jwt-3' } }),
      ),
      http.post(`${BASE}/logout`, () => new HttpResponse(null, { status: 204 })),
    )
    renderWithAuth()
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('darrow'))

    await userEvent.click(screen.getByRole('button', { name: 'sign out' }))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'))
    expect(getAccessToken()).toBeUndefined()
  })

  it('should clear the session when logout fails', async () => {
    server.use(
      http.post(`${BASE}/refresh`, () =>
        HttpResponse.json({ data: { ...auth, accessToken: 'jwt-3' } }),
      ),
      http.post(`${BASE}/logout`, () => new HttpResponse(null, { status: 500 })),
    )
    renderWithAuth()
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('darrow'))

    await userEvent.click(screen.getByRole('button', { name: 'sign out' }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
    expect(getAccessToken()).toBeUndefined()
  })

  it('should clear the session when a shared refresh fails', async () => {
    let refreshRequests = 0
    let protectedRequests = 0
    let markProtectedRequestsComplete: () => void = () => undefined
    const protectedRequestsComplete = new Promise<void>((resolve) => {
      markProtectedRequestsComplete = resolve
    })
    server.use(
      http.post(`${BASE}/refresh`, async () => {
        refreshRequests += 1
        if (refreshRequests === 1) {
          return HttpResponse.json({ data: { ...auth, accessToken: 'jwt-4' } })
        }
        await protectedRequestsComplete
        return new HttpResponse(null, { status: 401 })
      }),
      http.get(`${BASE}/me`, () => {
        protectedRequests += 1
        if (protectedRequests === 2) {
          markProtectedRequestsComplete()
        }
        return new HttpResponse(null, { status: 401 })
      }),
    )
    renderWithAuth()
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('darrow'))

    await userEvent.click(screen.getByRole('button', { name: 'load protected' }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
    expect(getAccessToken()).toBeUndefined()
    expect(refreshRequests).toBe(2)
  })
})
