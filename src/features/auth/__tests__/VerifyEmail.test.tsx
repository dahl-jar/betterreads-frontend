import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { stubSignedOut } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { VerifyEmail } from '../components/VerifyEmail'

const BASE = 'http://localhost:8080/api/v1/auth'

beforeEach(stubSignedOut)

describe('VerifyEmail', () => {
  it('should verify the URL token', async () => {
    let verifyBody: unknown
    server.use(
      http.post(`${BASE}/verify-email`, async ({ request }) => {
        verifyBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderWithProviders(<VerifyEmail token="verify-token-123" />)

    await waitFor(() => expect(screen.getByText(/email verified/i)).toBeInTheDocument())
    expect(verifyBody).toEqual({ token: 'verify-token-123' })
  })

  it('should link to the login once verified', async () => {
    server.use(http.post(`${BASE}/verify-email`, () => new HttpResponse(null, { status: 204 })))

    renderWithProviders(<VerifyEmail token="verify-token-123" />)

    await waitFor(() =>
      expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login'),
    )
  })

  it('should allow resend after verification fails', async () => {
    server.use(http.post(`${BASE}/verify-email`, () => new HttpResponse(null, { status: 400 })))

    renderWithProviders(<VerifyEmail token="stale-token" />)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /resend verification/i })).toBeInTheDocument(),
    )
    expect(screen.getByText(/couldn.t verify|invalid|expired/i)).toBeInTheDocument()
  })

  it('should confirm the resend request', async () => {
    server.use(
      http.post(`${BASE}/verify-email`, () => new HttpResponse(null, { status: 400 })),
      http.post(`${BASE}/resend-verification`, () => new HttpResponse(null, { status: 204 })),
    )
    const { user } = renderWithProviders(<VerifyEmail token="stale-token" />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /resend verification/i })).toBeInTheDocument(),
    )

    await user.type(screen.getByLabelText(/email/i), 'darrow@example.com')
    await user.click(screen.getByRole('button', { name: /resend verification/i }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/if that email|new link/i),
    )
  })
})
