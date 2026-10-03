import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken, getAccessToken } from '@/lib/api/token'
import { stubSignedOut } from '@/testing/authHandlers'
import auth from '@/testing/mocks/auth.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { RegisterForm } from '../components/RegisterForm'

const REGISTER_URL = 'http://localhost:8080/api/v1/auth/register'
const CONFLICT = 409
const SERVER_ERROR = 500

const VALID_FORM = {
  username: 'user',
  email: 'user@example.com',
  password: 'secret-12',
  confirmPassword: 'secret-12',
}

function recordRegister(respond: () => Response = () => new HttpResponse(null, { status: 201 })) {
  const sent: { body?: unknown } = {}
  server.use(
    http.post(REGISTER_URL, async ({ request }) => {
      sent.body = await request.json()
      return respond()
    }),
  )
  return sent
}

async function submitForm(overrides: Partial<typeof VALID_FORM> = {}) {
  const form = { ...VALID_FORM, ...overrides }
  const { user } = renderWithProviders(<RegisterForm />)
  await user.type(screen.getByLabelText(/username/i), form.username)
  await user.type(screen.getByLabelText(/email/i), form.email)
  await user.type(screen.getByLabelText('Password'), form.password)
  await user.type(screen.getByLabelText(/confirm password/i), form.confirmPassword)
  await user.click(screen.getByRole('button', { name: /create account/i }))
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

beforeEach(stubSignedOut)

describe('RegisterForm', () => {
  it('should tell the reader to check their email', async () => {
    const sent = recordRegister()

    await submitForm()

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Check your email to verify your account, then log in.',
      ),
    )
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
    expect(sent.body).toEqual({
      username: VALID_FORM.username,
      email: VALID_FORM.email,
      password: VALID_FORM.password,
    })
  })

  it('should leave the reader signed out after registering', async () => {
    recordRegister(() => HttpResponse.json({ data: { ...auth } }, { status: 201 }))

    await submitForm()

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(getAccessToken()).toBeUndefined()
  })

  it.each([
    [
      'a short password',
      { password: 'short', confirmPassword: 'short' },
      'Password must be at least 8 characters',
    ],
    [
      'a username with disallowed characters',
      { username: 'user!' },
      'Use only letters, numbers, dot, underscore, or hyphen',
    ],
    [
      'an email without a valid domain',
      { email: 'user@localhost' },
      'Enter a valid email with a domain, like name@example.com',
    ],
    ['mismatched passwords', { confirmPassword: 'differentpass' }, 'Passwords do not match'],
  ])('should reject %s', async (_case, overrides, message) => {
    const sent = recordRegister()

    await submitForm(overrides)

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(sent.body).toBeUndefined()
  })

  it('should say the username or email is taken when the server refuses it', async () => {
    recordRegister(() => new HttpResponse(null, { status: CONFLICT }))

    await submitForm()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That username or email is already taken. Try another.',
    )
  })

  it('should show the general error for any other failure', async () => {
    recordRegister(() => new HttpResponse(null, { status: SERVER_ERROR }))

    await submitForm()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not create your account. Try again.',
    )
  })
})
