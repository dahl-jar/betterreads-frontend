import { delay, http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthContext } from '@/hooks/useAuth'
import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { render, renderWithProviders, screen } from '@/testing/test-utils'

import { AuthenticatedPage } from './AuthenticatedPage'

const AUTH_BASE = 'http://localhost:8080/api/v1/auth'

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('AuthenticatedPage', () => {
  it('should render the children for a signed-in reader', async () => {
    stubSignedIn()

    renderWithProviders(
      <AuthenticatedPage>
        <p>secret content</p>
      </AuthenticatedPage>,
    )

    expect(await screen.findByText('secret content')).toBeInTheDocument()
  })

  it('should announce the session skeleton while authentication loads', async () => {
    server.use(
      http.post(`${AUTH_BASE}/refresh`, async () => {
        await delay('infinite')
        return new HttpResponse(null, { status: 401 })
      }),
    )

    renderWithProviders(
      <AuthenticatedPage>
        <p>secret content</p>
      </AuthenticatedPage>,
    )

    expect(
      await screen.findByRole('status', { name: /loading.*account|restoring.*session/i }),
    ).toBeInTheDocument()
  })

  it('should redirect an anonymous reader to login', async () => {
    const unusedAction = vi.fn(() => Promise.resolve())
    render(
      <AuthContext.Provider
        value={{
          user: undefined,
          status: 'anonymous',
          login: unusedAction,
          logout: unusedAction,
          deleteAccount: unusedAction,
        }}
      >
        <MemoryRouter initialEntries={['/shelf']}>
          <Routes>
            <Route
              path="/shelf"
              element={
                <AuthenticatedPage>
                  <p>secret content</p>
                </AuthenticatedPage>
              }
            />
            <Route path="/login" element={<p>login destination</p>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(await screen.findByText('login destination')).toBeInTheDocument()
  })
})
