import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { stubSignedOut } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { VerifyEmail } from '../components/VerifyEmail'

const BASE = 'http://localhost:8080/api/v1/auth'

beforeEach(stubSignedOut)

describe('VerifyEmail', () => {
  it('should link "Go to My books" to the shelf once verified', async () => {
    server.use(http.post(`${BASE}/verify-email`, () => new HttpResponse(null, { status: 204 })))

    renderWithProviders(<VerifyEmail token="verify-token-123" />)

    expect(await screen.findByRole('link', { name: 'Go to My books' })).toHaveAttribute(
      'href',
      '/shelf',
    )
  })

  it('should allow resend after verification fails', async () => {
    server.use(http.post(`${BASE}/verify-email`, () => new HttpResponse(null, { status: 400 })))

    renderWithProviders(<VerifyEmail token="stale-token" />)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /resend verification/i })).toBeInTheDocument(),
    )
    expect(
      screen.getByText(
        "We couldn't verify that link. It may be invalid or expired. Request a new one below.",
      ),
    ).toBeInTheDocument()
  })
})
