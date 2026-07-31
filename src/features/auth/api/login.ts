import { apiPost } from '@/lib/api/client'

import { type AuthResponse, type LoginInput, parseAuthResponse } from './schemas'

export async function login(input: LoginInput): Promise<AuthResponse> {
  const raw = await apiPost('/api/v1/auth/login', input)
  return parseAuthResponse(raw)
}
