import { apiPost } from '@/lib/api/client'

import { type ForgotPasswordInput } from './schemas'

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  await apiPost('/api/v1/auth/forgot-password', input)
}
