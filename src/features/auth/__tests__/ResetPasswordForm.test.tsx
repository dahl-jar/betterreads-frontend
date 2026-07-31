import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { stubSignedOut } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { ResetPasswordForm } from '../components/ResetPasswordForm'

const BASE = 'http://localhost:8080/api/v1/auth'

beforeEach(stubSignedOut)

describe('ResetPasswordForm', () => {
  it('should complete a password reset', async () => {
    let resetBody: unknown
    server.use(
      http.post(`${BASE}/reset-password`, async ({ request }) => {
        resetBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const onSuccess = vi.fn()
    const { user } = renderWithProviders(
      <ResetPasswordForm token="reset-token-123" onSuccess={onSuccess} />,
    )

    await user.type(screen.getByLabelText(/new password/i), 'a-brand-new-pass')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(resetBody).toEqual({
      token: 'reset-token-123',
      newPassword: 'a-brand-new-pass',
    })
  })

  it('should reject a short password', async () => {
    let called = false
    server.use(
      http.post(`${BASE}/reset-password`, () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderWithProviders(
      <ResetPasswordForm token="reset-token-123" onSuccess={vi.fn()} />,
    )

    await user.type(screen.getByLabelText(/new password/i), 'short')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() =>
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument(),
    )
    expect(called).toBe(false)
  })

  it('should reject an expired reset token', async () => {
    server.use(http.post(`${BASE}/reset-password`, () => new HttpResponse(null, { status: 400 })))
    const onSuccess = vi.fn()
    const { user } = renderWithProviders(
      <ResetPasswordForm token="stale-token" onSuccess={onSuccess} />,
    )

    await user.type(screen.getByLabelText(/new password/i), 'a-brand-new-pass')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/expired|invalid|request a new/i),
    )
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
