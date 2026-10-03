import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { CURRENT_PASSWORD, NEW_PASSWORD } from '@/testing/passwords'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { ChangePasswordForm } from '../components/ChangePasswordForm'

const PASSWORD_URL = 'http://localhost:8080/api/v1/auth/me/password'
const BAD_REQUEST = 400
const TOO_MANY_REQUESTS = 429

function renderForm() {
  const onSuccess = vi.fn()
  const rendered = renderWithProviders(
    <ChangePasswordForm onSuccess={onSuccess} onCancel={vi.fn()} />,
  )
  return { onSuccess, ...rendered }
}

async function fillAndSave(
  user: ReturnType<typeof renderWithProviders>['user'],
  { repeat = NEW_PASSWORD, current = CURRENT_PASSWORD } = {},
) {
  const currentField = await screen.findByLabelText('Current password')
  if (current) {
    await user.type(currentField, current)
  }
  await user.type(screen.getByLabelText('New password'), NEW_PASSWORD)
  await user.type(screen.getByLabelText('Repeat new password'), repeat)
  await user.click(screen.getByRole('button', { name: 'Save password' }))
}

function recordChange() {
  const sent: { body?: unknown } = {}
  server.use(
    http.put(PASSWORD_URL, async ({ request }) => {
      sent.body = await request.json()
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return sent
}

function problem(status: number, detail: string) {
  return HttpResponse.json(
    { detail },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

beforeEach(stubSignedIn)

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('ChangePasswordForm', () => {
  it('should send the current and new password', async () => {
    const sent = recordChange()
    const { user, onSuccess } = renderForm()

    await fillAndSave(user)

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(sent.body).toEqual({ currentPassword: CURRENT_PASSWORD, newPassword: NEW_PASSWORD })
  })

  it('should not send when the new passwords differ', async () => {
    const sent = recordChange()
    const { user } = renderForm()

    await fillAndSave(user, { repeat: 'break-the-chain' })

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(sent.body).toBeUndefined()
  })

  it('should not send without the current password', async () => {
    const sent = recordChange()
    const { user } = renderForm()

    await fillAndSave(user, { current: '' })

    expect(await screen.findByText('Current password is required')).toBeInTheDocument()
    expect(sent.body).toBeUndefined()
  })

  it('should say the current password is wrong when the server rejects it', async () => {
    server.use(http.put(PASSWORD_URL, () => problem(BAD_REQUEST, 'Current password is incorrect')))
    const { user, onSuccess } = renderForm()

    await fillAndSave(user)

    expect(await screen.findByText('Current password is incorrect. Try again.')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it.each([
    [TOO_MANY_REQUESTS, 'Too many requests'],
    [BAD_REQUEST, 'Password must be at most 72 bytes'],
  ])('should show the general error for a %i "%s"', async (status, detail) => {
    server.use(http.put(PASSWORD_URL, () => problem(status, detail)))
    const { user, onSuccess } = renderForm()

    await fillAndSave(user)

    expect(
      await screen.findByText('Could not change your password. Try again.'),
    ).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
