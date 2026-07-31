import { apiPost } from '@/lib/api/client'

import { type VerifyEmailInput } from './schemas'

export async function verifyEmail(input: VerifyEmailInput): Promise<void> {
  await apiPost('/api/v1/auth/verify-email', input)
}
