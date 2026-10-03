import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'
import { CURRENT_PASSWORD, NEW_PASSWORD } from '@/testing/passwords'

import { changePassword } from '../api/changePassword'

const PASSWORD_URL = 'http://localhost:8080/api/v1/auth/me/password'

describe('changePassword', () => {
  it('should send the change once when the network fails', async () => {
    let attempts = 0
    server.use(
      http.put(PASSWORD_URL, () => {
        attempts += 1
        return HttpResponse.error()
      }),
    )

    await expect(
      changePassword({ currentPassword: CURRENT_PASSWORD, newPassword: NEW_PASSWORD }),
    ).rejects.toThrow()
    expect(attempts).toBe(1)
  })
})
