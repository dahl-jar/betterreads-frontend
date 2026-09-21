import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { getBookCount } from '../api/getBookCount'

const COUNT_URL = 'http://localhost:8080/api/v1/books/count'

describe('getBookCount', () => {
  it('should return the total from the count endpoint', async () => {
    server.use(http.get(COUNT_URL, () => HttpResponse.json({ data: { total: 12_345 } })))

    const total = await getBookCount(new AbortController().signal)

    expect(total).toBe(12_345)
  })

  it('should reject a payload without a total', async () => {
    server.use(http.get(COUNT_URL, () => HttpResponse.json({ data: {} })))

    await expect(getBookCount(new AbortController().signal)).rejects.toThrow()
  })
})
