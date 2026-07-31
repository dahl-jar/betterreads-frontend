import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { clearAccessToken } from '@/lib/api/token'
import auth from '@/testing/mocks/auth.json'
import { server } from '@/testing/msw-server'

import { deleteAccount } from '../api/deleteAccount'
import { forgotPassword } from '../api/forgotPassword'
import { login } from '../api/login'
import { refresh } from '../api/refresh'
import { register } from '../api/register'
import { resetPassword } from '../api/resetPassword'
import { verifyEmail } from '../api/verifyEmail'

const BASE = 'http://localhost:8080/api/v1/auth'

afterEach(() => {
  clearAccessToken()
})

describe('refresh', () => {
  it('should collapse concurrent calls into one network rotation', async () => {
    let rotations = 0
    server.use(
      http.post(`${BASE}/refresh`, () => {
        rotations += 1
        return HttpResponse.json({ data: { ...auth, accessToken: `jwt-${rotations}` } })
      }),
    )

    const [first, second] = await Promise.all([refresh(), refresh()])

    expect(rotations).toBe(1)
    expect(first.accessToken).toBe('jwt-1')
    expect(second.accessToken).toBe('jwt-1')
  })

  it('should rotate after the prior refresh settles', async () => {
    let rotations = 0
    server.use(
      http.post(`${BASE}/refresh`, () => {
        rotations += 1
        return HttpResponse.json({ data: { ...auth, accessToken: `jwt-${rotations}` } })
      }),
    )

    const initial = await refresh()
    const next = await refresh()

    expect(rotations).toBe(2)
    expect(initial.accessToken).toBe('jwt-1')
    expect(next.accessToken).toBe('jwt-2')
  })

  it('should let a later call retry after the in-flight rotation failed', async () => {
    let rotations = 0
    server.use(
      http.post(`${BASE}/refresh`, () => {
        rotations += 1
        if (rotations === 1) {
          return new HttpResponse(null, { status: 401 })
        }
        return HttpResponse.json({ data: { ...auth, accessToken: 'jwt-recovered' } })
      }),
    )

    await expect(refresh()).rejects.toThrow()
    const recovered = await refresh()

    expect(recovered.accessToken).toBe('jwt-recovered')
  })
})

describe('register', () => {
  it('should return a token after registration', async () => {
    let sentBody: unknown
    server.use(
      http.post(`${BASE}/register`, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json({ data: { ...auth, accessToken: 'jwt-abc' } })
      }),
    )

    const result = await register({
      username: 'darrow',
      email: 'darrow@example.com',
      password: 'secret-12',
    })

    expect(sentBody).toEqual({
      username: 'darrow',
      email: 'darrow@example.com',
      password: 'secret-12',
    })
    expect(result.accessToken).toBe('jwt-abc')
  })

  it('should reject a success response with no access token', async () => {
    server.use(
      http.post(`${BASE}/register`, () => HttpResponse.json({ data: { unexpected: true } })),
    )

    await expect(
      register({ username: 'darrow', email: 'darrow@example.com', password: 'secret-12' }),
    ).rejects.toThrow()
  })
})

describe('login', () => {
  it('should send the login credentials', async () => {
    let sentBody: unknown
    server.use(
      http.post(`${BASE}/login`, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json({ data: { ...auth, accessToken: 'jwt-xyz' } })
      }),
    )

    await login({ identifier: 'darrow@example.com', password: 'secret-12' })

    expect(sentBody).toEqual({ identifier: 'darrow@example.com', password: 'secret-12' })
  })
})

describe('forgotPassword', () => {
  it('should request a password reset', async () => {
    let sentBody: unknown
    server.use(
      http.post(`${BASE}/forgot-password`, async ({ request }) => {
        sentBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await forgotPassword({ email: 'darrow@example.com' })

    expect(sentBody).toEqual({ email: 'darrow@example.com' })
  })
})

describe('resetPassword', () => {
  it('should send the password reset input', async () => {
    let sentBody: unknown
    server.use(
      http.post(`${BASE}/reset-password`, async ({ request }) => {
        sentBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await resetPassword({ token: 'reset-token', newPassword: 'brand-new-pass' })

    expect(sentBody).toEqual({ token: 'reset-token', newPassword: 'brand-new-pass' })
  })
})

describe('verifyEmail', () => {
  it('should send the token to the verify endpoint', async () => {
    let sentBody: unknown
    server.use(
      http.post(`${BASE}/verify-email`, async ({ request }) => {
        sentBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await verifyEmail({ token: 'verify-token' })

    expect(sentBody).toEqual({ token: 'verify-token' })
  })
})

describe('deleteAccount', () => {
  it('should delete the account', async () => {
    let method = ''
    server.use(
      http.delete(`${BASE}/me`, ({ request }) => {
        method = request.method
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(deleteAccount()).resolves.toBeUndefined()
    expect(method).toBe('DELETE')
  })
})
