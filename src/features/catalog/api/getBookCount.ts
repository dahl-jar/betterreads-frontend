import { z } from 'zod'

import { apiGet } from '@/lib/api/client'

const COUNT_PATH = '/api/v1/books/count'

const bookCountSchema = z.object({ total: z.number().int().nonnegative() })

export async function getBookCount(signal: AbortSignal): Promise<number> {
  const raw = await apiGet(COUNT_PATH, { signal })
  return bookCountSchema.parse(raw).total
}
