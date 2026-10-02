import { apiPostIgnoringResponse } from '@/lib/api/client'

import { type RegisterInput } from './schemas'

export async function register(input: RegisterInput): Promise<void> {
  await apiPostIgnoringResponse('/api/v1/auth/register', input)
}
