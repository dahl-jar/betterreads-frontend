import { z } from 'zod'

import { apiGet } from '@/lib/api/client'

const myShelfCountsSchema = z.object({
  total: z.number().int(),
})

type MyShelfCounts = z.infer<typeof myShelfCountsSchema>

export async function getMyShelfCounts(signal?: AbortSignal): Promise<MyShelfCounts> {
  const raw = await apiGet('/api/v1/me/books/counts', signal ? { signal } : {})
  return myShelfCountsSchema.parse(raw)
}
