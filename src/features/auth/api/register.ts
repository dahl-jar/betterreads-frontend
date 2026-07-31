import { apiPost } from '@/lib/api/client'

import { type AuthResponse, parseAuthResponse, type RegisterInput } from './schemas'

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const raw = await apiPost('/api/v1/auth/register', input)
  return parseAuthResponse(raw)
}
