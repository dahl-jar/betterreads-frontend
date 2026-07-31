import { apiPost } from '@/lib/api/client'

import { type ResetPasswordInput } from './schemas'

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await apiPost('/api/v1/auth/reset-password', input)
}
