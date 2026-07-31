import { apiPost } from '@/lib/api/client'

import { type ResendVerificationInput } from './schemas'

export async function resendVerification(input: ResendVerificationInput): Promise<void> {
  await apiPost('/api/v1/auth/resend-verification', input)
}
