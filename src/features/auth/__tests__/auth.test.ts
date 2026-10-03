import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { clearAccessToken } from '@/lib/api/token'
import auth from '@/testing/mocks/auth.json'
import { server } from '@/testing/msw-server'

import { refresh } from '../api/refresh'

const BASE = 'http://localhost:8080/api/v1/auth'

function countRotations() {
  const rotations = { count: 0 }
  server.use(
    http.post(`${BASE}/refresh`, () => {
      rotations.count += 1
      return HttpResponse.json({ data: { ...auth, accessToken: `jwt-${rotations.count}` } })
    }),
  )
  return rotations
}

afterEach(() => {
  clearAccessToken()
})

describe('refresh', () => {
  it('should collapse concurrent calls into one network rotation', async () => {
    const rotations = countRotations()

    const [first, second] = await Promise.all([refresh(), refresh()])

    expect(rotations.count).toBe(1)
    expect(first.accessToken).toBe('jwt-1')
    expect(second.accessToken).toBe('jwt-1')
  })

  it('should rotate after the prior refresh settles', async () => {
    const rotations = countRotations()

    const initial = await refresh()
    const next = await refresh()

    expect(rotations.count).toBe(2)
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
