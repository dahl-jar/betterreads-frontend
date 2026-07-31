import { apiPost } from '@/lib/api/client'

export async function logout(): Promise<void> {
  await apiPost('/api/v1/auth/logout', undefined)
}
