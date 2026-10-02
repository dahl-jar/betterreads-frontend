import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken, getAccessToken } from '@/lib/api/token'
import { stubSignedOut } from '@/testing/authHandlers'
import auth from '@/testing/mocks/auth.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { RegisterForm } from '../components/RegisterForm'

const BASE = 'http://localhost:8080/api/v1/auth'

async function fillValidForm(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.type(screen.getByLabelText(/username/i), 'darrow')
  await user.type(screen.getByLabelText(/email/i), 'darrow@example.com')
  await user.type(screen.getByLabelText('Password'), 'secret-12')
  await user.type(screen.getByLabelText(/confirm password/i), 'secret-12')
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

beforeEach(stubSignedOut)

describe('RegisterForm', () => {
  it('should complete registration', async () => {
    let registerBody: unknown
    server.use(
      http.post(`${BASE}/register`, async ({ request }) => {
        registerBody = await request.json()
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const { user } = renderWithProviders(<RegisterForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(registerBody).toEqual({
      username: 'darrow',
      email: 'darrow@example.com',
      password: 'secret-12',
    })
  })

  it('should tell the reader to check their email after registering', async () => {
    server.use(http.post(`${BASE}/register`, () => new HttpResponse(null, { status: 201 })))
    const { user } = renderWithProviders(<RegisterForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Check your email to verify your account, then log in.',
      ),
    )
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
  })

  it('should leave the reader signed out after registering', async () => {
    server.use(
      http.post(`${BASE}/register`, () =>
        HttpResponse.json({ data: { ...auth } }, { status: 201 }),
      ),
    )
    const { user } = renderWithProviders(<RegisterForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(getAccessToken()).toBeUndefined()
  })

  it('should reject a short password', async () => {
    let registerCalled = false
    server.use(
      http.post(`${BASE}/register`, () => {
        registerCalled = true
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const { user } = renderWithProviders(<RegisterForm />)

    await user.type(screen.getByLabelText(/username/i), 'darrow')
    await user.type(screen.getByLabelText(/email/i), 'darrow@example.com')
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument(),
    )
    expect(registerCalled).toBe(false)
  })

  it('should reject a username with disallowed characters', async () => {
    let registerCalled = false
    server.use(
      http.post(`${BASE}/register`, () => {
        registerCalled = true
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const { user } = renderWithProviders(<RegisterForm />)

    await user.type(screen.getByLabelText(/username/i), 'darrow!')
    await user.type(screen.getByLabelText(/email/i), 'darrow@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret-12')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(
        screen.getByText('Use only letters, numbers, dot, underscore, or hyphen'),
      ).toBeInTheDocument(),
    )
    expect(registerCalled).toBe(false)
  })

  it('should reject an email without a valid domain', async () => {
    let registerCalled = false
    server.use(
      http.post(`${BASE}/register`, () => {
        registerCalled = true
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const { user } = renderWithProviders(<RegisterForm />)

    await user.type(screen.getByLabelText(/username/i), 'darrow')
    await user.type(screen.getByLabelText(/email/i), 'darrow@localhost')
    await user.type(screen.getByLabelText('Password'), 'secret-12')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(
        screen.getByText('Enter a valid email with a domain, like name@example.com'),
      ).toBeInTheDocument(),
    )
    expect(registerCalled).toBe(false)
  })

  it('should reject mismatched passwords', async () => {
    let registerCalled = false
    server.use(
      http.post(`${BASE}/register`, () => {
        registerCalled = true
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const { user } = renderWithProviders(<RegisterForm />)

    await user.type(screen.getByLabelText(/username/i), 'darrow')
    await user.type(screen.getByLabelText(/email/i), 'darrow@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret-12')
    await user.type(screen.getByLabelText(/confirm password/i), 'differentpass')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(screen.getByText('Passwords do not match')).toBeInTheDocument())
    expect(registerCalled).toBe(false)
  })

  it('should show an error when the username is already taken', async () => {
    server.use(http.post(`${BASE}/register`, () => new HttpResponse(null, { status: 409 })))
    const { user } = renderWithProviders(<RegisterForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })
})
