import { delay, http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen } from '@/testing/test-utils'

import { AuthenticatedPage } from './AuthenticatedPage'

const AUTH_BASE = 'http://localhost:8080/api/v1/auth'

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

function renderPage() {
  return renderWithProviders(
    <AuthenticatedPage>
      <p>secret content</p>
    </AuthenticatedPage>,
  )
}

describe('AuthenticatedPage', () => {
  it('should render the children for a signed-in reader', async () => {
    stubSignedIn()

    renderPage()

    expect(await screen.findByText('secret content')).toBeInTheDocument()
  })

  it('should announce the session skeleton while authentication loads', async () => {
    server.use(
      http.post(`${AUTH_BASE}/refresh`, async () => {
        await delay('infinite')
        return new HttpResponse(null, { status: 401 })
      }),
    )

    renderPage()

    expect(
      await screen.findByRole('status', { name: /loading.*account|restoring.*session/i }),
    ).toBeInTheDocument()
  })
})
