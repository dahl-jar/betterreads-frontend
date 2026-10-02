import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import shelfCounts from '@/testing/mocks/shelf-counts.json'
import { server } from '@/testing/msw-server'

import { getShelfCounts } from '../api/getShelfCounts'

const DUNE_KEY = 'OL893415W'
const COUNTS_URL = `http://localhost:8080/api/v1/books/${DUNE_KEY}/shelf-counts`

describe('getShelfCounts', () => {
  it('should return the parsed counts', async () => {
    server.use(http.get(COUNTS_URL, () => HttpResponse.json(shelfCounts)))

    const counts = await getShelfCounts(DUNE_KEY)

    expect(counts).toEqual({ wantToRead: 3, currentlyReading: 12, finished: 40, dropped: 1 })
  })

  it.each(['wantToRead', 'currentlyReading', 'finished', 'dropped'])(
    'should reject a payload missing %s',
    async (missing) => {
      const incomplete = Object.fromEntries(
        Object.entries(shelfCounts.data).filter(([name]) => name !== missing),
      )
      server.use(http.get(COUNTS_URL, () => HttpResponse.json({ data: incomplete })))

      await expect(getShelfCounts(DUNE_KEY)).rejects.toBeInstanceOf(ZodError)
    },
  )
})
