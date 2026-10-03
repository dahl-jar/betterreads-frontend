import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { stubSignedOut } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { ForgotPasswordForm } from '../components/ForgotPasswordForm'

const FORGOT_URL = 'http://localhost:8080/api/v1/auth/forgot-password'
const KNOWN_EMAIL = 'known@example.com'

function recordRequests(status = 204) {
  const emails: string[] = []
  server.use(
    http.post(FORGOT_URL, async ({ request }) => {
      const body = (await request.json()) as { email: string }
      emails.push(body.email)
      return new HttpResponse(null, { status })
    }),
  )
  return emails
}

async function requestReset(email: string) {
  const { user } = renderWithProviders(<ForgotPasswordForm />)
  await user.type(screen.getByLabelText(/email/i), email)
  await user.click(screen.getByRole('button', { name: /send reset link/i }))
}

beforeEach(stubSignedOut)

describe('ForgotPasswordForm', () => {
  it('should confirm the request', async () => {
    const emails = recordRequests()

    await requestReset(KNOWN_EMAIL)

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'If that email has an account, a reset link is on its way. Check your inbox.',
      ),
    )
    expect(emails).toEqual([KNOWN_EMAIL])
  })

  it('should not submit an address without a valid domain', async () => {
    const emails = recordRequests()

    await requestReset('not-an-email')

    await waitFor(() => expect(screen.getByText(/valid email/i)).toBeInTheDocument())
    expect(emails).toEqual([])
  })

  it('should confirm a failed request', async () => {
    recordRequests(500)

    await requestReset(KNOWN_EMAIL)

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'If that email has an account, a reset link is on its way. Check your inbox.',
      ),
    )
  })
})
