import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { stubSignedOut } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { ForgotPasswordForm } from '../components/ForgotPasswordForm'

const BASE = 'http://localhost:8080/api/v1/auth'

beforeEach(stubSignedOut)

describe('ForgotPasswordForm', () => {
  it('should confirm the request', async () => {
    const submittedEmails: string[] = []
    server.use(
      http.post(`${BASE}/forgot-password`, async ({ request }) => {
        const body = (await request.json()) as { email: string }
        submittedEmails.push(body.email)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderWithProviders(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText(/email/i), 'known@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/if that email/i))
    expect(submittedEmails).toEqual(['known@example.com'])
  })

  it('should not submit an address without a valid domain', async () => {
    let called = false
    server.use(
      http.post(`${BASE}/forgot-password`, () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderWithProviders(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => expect(screen.getByText(/valid email/i)).toBeInTheDocument())
    expect(called).toBe(false)
  })

  it('should confirm a failed request', async () => {
    server.use(http.post(`${BASE}/forgot-password`, () => new HttpResponse(null, { status: 500 })))
    const { user } = renderWithProviders(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText(/email/i), 'known@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/if that email/i))
  })
})
