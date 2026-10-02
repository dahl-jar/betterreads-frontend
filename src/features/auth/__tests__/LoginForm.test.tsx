import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedOut } from '@/testing/authHandlers'
import auth from '@/testing/mocks/auth.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { LoginForm } from '../components/LoginForm'

const BASE = 'http://localhost:8080/api/v1/auth'

const CREDENTIALS = { identifier: 'darrow@example.com', password: 'opensesame' }

const USUAL_ERROR = 'Email, username, or password is incorrect. Try again.'

const VERIFY_MESSAGE = 'Verify your email to log in.'

const VERIFY_LINK = { name: /send a new verification email/i }

function renderForm() {
  const onSuccess = vi.fn()
  const { user } = renderWithProviders(<LoginForm onSuccess={onSuccess} />)
  return { user, onSuccess }
}

async function submit(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.type(screen.getByLabelText(/email or username/i), CREDENTIALS.identifier)
  await user.type(screen.getByLabelText(/password/i), CREDENTIALS.password)
  await user.click(screen.getByRole('button', { name: /log in/i }))
}

async function expectAlert(text: string) {
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(text))
}

function captureLoginBody(): () => unknown {
  let loginBody: unknown
  server.use(
    http.post(`${BASE}/login`, async ({ request }) => {
      loginBody = await request.json()
      return HttpResponse.json({ data: { ...auth, accessToken: 'jwt-1' } })
    }),
  )
  return () => loginBody
}

function unverifiedProblem() {
  return HttpResponse.json(
    { detail: 'Verify your email to log in' },
    { status: 403, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

beforeEach(stubSignedOut)

describe('LoginForm', () => {
  it('should leave "Remember me" off by default', async () => {
    const loginBody = captureLoginBody()
    const { user, onSuccess } = renderForm()

    await submit(user)

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(loginBody()).toEqual({ ...CREDENTIALS, rememberMe: false })
  })

  it('should send "Remember me" when the box is ticked', async () => {
    const loginBody = captureLoginBody()
    const { user, onSuccess } = renderForm()

    await user.click(screen.getByRole('checkbox', { name: /remember me/i }))
    await submit(user)

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(loginBody()).toEqual({ ...CREDENTIALS, rememberMe: true })
  })

  it('should ask the reader to verify their email when the account is unverified', async () => {
    server.use(http.post(`${BASE}/login`, unverifiedProblem))
    const { user, onSuccess } = renderForm()

    await submit(user)

    await expectAlert(VERIFY_MESSAGE)
    expect(screen.getByRole('link', VERIFY_LINK)).toHaveAttribute('href', '/verify-email')
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('should replace the verify message after a later wrong password', async () => {
    let attempts = 0
    server.use(
      http.post(`${BASE}/login`, () => {
        attempts += 1
        return attempts === 1 ? unverifiedProblem() : new HttpResponse(null, { status: 401 })
      }),
    )
    const { user } = renderForm()
    await submit(user)
    await expectAlert(VERIFY_MESSAGE)

    await user.click(screen.getByRole('button', { name: /log in/i }))

    await expectAlert(USUAL_ERROR)
    expect(screen.queryByRole('link', VERIFY_LINK)).not.toBeInTheDocument()
  })

  it('should keep the usual error for a 403 that is not about verification', async () => {
    server.use(http.post(`${BASE}/login`, () => new HttpResponse(null, { status: 403 })))
    const { user } = renderForm()

    await submit(user)

    await expectAlert(USUAL_ERROR)
  })

  it('should reject wrong credentials', async () => {
    server.use(http.post(`${BASE}/login`, () => new HttpResponse(null, { status: 401 })))
    const { user, onSuccess } = renderForm()

    await submit(user)

    await expectAlert(USUAL_ERROR)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('should reject an empty password', async () => {
    let loginCalled = false
    server.use(
      http.post(`${BASE}/login`, () => {
        loginCalled = true
        return HttpResponse.json({ data: { ...auth, accessToken: 'jwt-1' } })
      }),
    )
    const { user } = renderForm()

    await user.type(screen.getByLabelText(/email or username/i), 'darrow')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => expect(screen.getByText(/password is required/i)).toBeInTheDocument())
    expect(loginCalled).toBe(false)
  })
})
