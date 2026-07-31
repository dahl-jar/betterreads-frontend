import { apiPost } from '@/lib/api/client'

import { type AuthResponse, parseAuthResponse } from './schemas'

let inFlightRefresh: Promise<AuthResponse> | undefined

/** Rotates the refresh cookie while sharing concurrent rotations. */
export async function refresh(): Promise<AuthResponse> {
  if (inFlightRefresh === undefined) {
    inFlightRefresh = apiPost('/api/v1/auth/refresh', undefined)
      .then(parseAuthResponse)
      .finally(() => {
        inFlightRefresh = undefined
      })
  }
  return inFlightRefresh
}
