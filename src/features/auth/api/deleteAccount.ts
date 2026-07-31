import { apiDelete } from '@/lib/api/client'

export async function deleteAccount(): Promise<void> {
  await apiDelete('/api/v1/auth/me')
}
