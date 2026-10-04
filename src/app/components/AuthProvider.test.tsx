import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { useAuth } from '@/hooks/useAuth'
import { apiGet, setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken, getAccessToken } from '@/lib/api/token'
import { clearDrafts, readDraft, writeDraft } from '@/lib/draftStore'
import { holdResponse } from '@/testing/holdResponse'
import auth from '@/testing/mocks/auth.json'
import draft from '@/testing/mocks/draft.json'
import { server } from '@/testing/msw-server'

import { AuthProvider } from './AuthProvider'

const BASE = 'http://localhost:8080/api/v1/auth'

function Probe() {
  const { user, status, login, logout, deleteAccount } = useAuth()
  const signIn = () => void login({ identifier: 'user', password: 'secret-12', rememberMe: false })
  const signOut = () => void logout().catch(() => undefined)
  const removeAccount = () => void deleteAccount().catch(() => undefined)
  const loadProtected = () =>
    void Promise.allSettled([apiGet('/api/v1/auth/me'), apiGet('/api/v1/auth/me')])
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.username ?? 'none'}</span>
      <button onClick={signIn}>sign in</button>
      <button onClick={signOut}>sign out</button>
      <button onClick={removeAccount}>delete account</button>
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

async function renderSignedIn(logoutStatus: number) {
  server.use(
    http.post(`${BASE}/refresh`, () =>
      HttpResponse.json({ data: { ...auth, accessToken: 'jwt-3' } }),
    ),
    http.post(`${BASE}/logout`, () => new HttpResponse(null, { status: logoutStatus })),
  )
  renderWithAuth()
  await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('user'))
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
  clearDrafts()
})

describe('AuthProvider', () => {
  it('should recover a valid session', async () => {
    server.use(
      http.post(`${BASE}/refresh`, () =>
        HttpResponse.json({ data: { ...auth, accessToken: 'jwt-1' } }),
      ),
    )

    renderWithAuth()

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('user'))
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
        HttpResponse.json({ data: { ...auth, accessToken: 'jwt-2' } }),
      ),
    )
    renderWithAuth()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))

    await userEvent.click(screen.getByRole('button', { name: 'sign in' }))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('user'))
    expect(getAccessToken()).toBe('jwt-2')
  })

  it('should clear the session after logout', async () => {
    await renderSignedIn(204)

    await userEvent.click(screen.getByRole('button', { name: 'sign out' }))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'))
    expect(getAccessToken()).toBeUndefined()
  })

  it.each([
    { outcome: 'succeeds', logoutStatus: 204 },
    { outcome: 'fails', logoutStatus: 500 },
  ])('should forget unposted drafts when logout $outcome', async ({ logoutStatus }) => {
    await renderSignedIn(logoutStatus)
    writeDraft('user', 'review-comment:7', draft)

    await userEvent.click(screen.getByRole('button', { name: 'sign out' }))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'))
    expect(readDraft('user', 'review-comment:7')).toBeUndefined()
  })

  it('should forget unposted drafts after the account is deleted', async () => {
    await renderSignedIn(204)
    server.use(http.delete(`${BASE}/me`, () => new HttpResponse(null, { status: 204 })))
    writeDraft('user', 'review-comment:7', draft)

    await userEvent.click(screen.getByRole('button', { name: 'delete account' }))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'))
    expect(readDraft('user', 'review-comment:7')).toBeUndefined()
  })

  it('should keep unposted drafts when deleting the account fails', async () => {
    let deleteRequests = 0
    await renderSignedIn(204)
    server.use(
      http.delete(`${BASE}/me`, () => {
        deleteRequests += 1
        return new HttpResponse(null, { status: 500 })
      }),
    )
    writeDraft('user', 'review-comment:7', draft)

    await userEvent.click(screen.getByRole('button', { name: 'delete account' }))

    await waitFor(() => expect(deleteRequests).toBe(1))
    expect(screen.getByTestId('user')).toHaveTextContent('user')
    expect(readDraft('user', 'review-comment:7')).toEqual(draft)
  })

  it('should clear the session when logout fails', async () => {
    await renderSignedIn(500)

    await userEvent.click(screen.getByRole('button', { name: 'sign out' }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
    expect(getAccessToken()).toBeUndefined()
  })

  it('should clear the session when a shared refresh fails', async () => {
    let refreshRequests = 0
    let protectedRequests = 0
    const protectedRequestsComplete = holdResponse()
    server.use(
      http.post(`${BASE}/refresh`, async () => {
        refreshRequests += 1
        if (refreshRequests === 1) {
          return HttpResponse.json({ data: { ...auth, accessToken: 'jwt-4' } })
        }
        await protectedRequestsComplete.held
        return new HttpResponse(null, { status: 401 })
      }),
      http.get(`${BASE}/me`, () => {
        protectedRequests += 1
        if (protectedRequests === 2) {
          protectedRequestsComplete.release()
        }
        return new HttpResponse(null, { status: 401 })
      }),
    )
    renderWithAuth()
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('user'))

    await userEvent.click(screen.getByRole('button', { name: 'load protected' }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
    expect(getAccessToken()).toBeUndefined()
    expect(refreshRequests).toBe(2)
  })
})
