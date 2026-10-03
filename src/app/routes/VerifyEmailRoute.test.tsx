import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedOut } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { VerifyEmailRoute } from './VerifyEmailRoute'

const BASE = 'http://localhost:8080/api/v1/auth'

async function requestResend(email: string) {
  const { user } = renderWithProviders(<VerifyEmailRoute />, { route: '/verify-email' })
  await user.type(screen.getByLabelText(/email/i), email)
  await user.click(screen.getByRole('button', { name: /resend verification/i }))
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

beforeEach(stubSignedOut)

describe('VerifyEmailRoute', () => {
  it('should verify the token from the link', async () => {
    let verifyBody: unknown
    server.use(
      http.post(`${BASE}/verify-email`, async ({ request }) => {
        verifyBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderWithProviders(<VerifyEmailRoute />, { route: '/verify-email?token=verify-token-123' })

    await waitFor(() =>
      expect(screen.getByText('Email verified. You are all set.')).toBeInTheDocument(),
    )
    expect(verifyBody).toEqual({ token: 'verify-token-123' })
  })

  it('should resend verification when the URL has no token', async () => {
    let resendBody: unknown
    server.use(
      http.post(`${BASE}/resend-verification`, async ({ request }) => {
        resendBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await requestResend('user@example.com')

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'If that email needs verifying, a new link is on its way. Check your inbox.',
      ),
    )
    expect(resendBody).toEqual({ email: 'user@example.com' })
  })
})
