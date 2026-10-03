import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { stubSignedOut } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { ResetPasswordForm } from '../components/ResetPasswordForm'

const RESET_URL = 'http://localhost:8080/api/v1/auth/reset-password'
const TOKEN = 'reset-token-123'
const NEW_PASSWORD = 'a-brand-new-pass'

function recordReset() {
  const sent: { body?: unknown } = {}
  server.use(
    http.post(RESET_URL, async ({ request }) => {
      sent.body = await request.json()
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return sent
}

async function submit(password: string, confirm?: string) {
  const onSuccess = vi.fn()
  const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} onSuccess={onSuccess} />)
  await user.type(screen.getByLabelText(/new password/i), password)
  if (confirm !== undefined) {
    await user.type(screen.getByLabelText(/confirm password/i), confirm)
  }
  await user.click(screen.getByRole('button', { name: /reset password/i }))
  return onSuccess
}

beforeEach(stubSignedOut)

describe('ResetPasswordForm', () => {
  it('should send only the token and new password', async () => {
    const sent = recordReset()

    const onSuccess = await submit(NEW_PASSWORD, NEW_PASSWORD)

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(sent.body).toEqual({ token: TOKEN, newPassword: NEW_PASSWORD })
  })

  it('should not send when the passwords differ', async () => {
    const sent = recordReset()

    await submit(NEW_PASSWORD, 'a-brand-new-pas')

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(sent.body).toBeUndefined()
  })

  it('should reject a short password', async () => {
    const sent = recordReset()

    await submit('short')

    await waitFor(() =>
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument(),
    )
    expect(sent.body).toBeUndefined()
  })

  it('should reject an expired reset token', async () => {
    server.use(http.post(RESET_URL, () => new HttpResponse(null, { status: 400 })))

    const onSuccess = await submit(NEW_PASSWORD, NEW_PASSWORD)

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'This reset link is invalid or expired. Request a new one.',
      ),
    )
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
