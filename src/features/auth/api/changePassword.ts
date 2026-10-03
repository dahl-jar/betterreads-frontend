import { apiPut } from '@/lib/api/client'

import { type ChangePasswordInput } from './schemas'

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiPut('/api/v1/auth/me/password', input, { retry: false })
}
