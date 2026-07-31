import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { changeFavorite } from '../api/changeFavorite'
import { changeShelfStatus } from '../api/changeShelfStatus'
import { getShelf } from '../api/getShelf'
import { removeFromShelf } from '../api/removeFromShelf'

import shelfEntry from './mocks/shelf-entry.json'

const SHELF_URL = 'http://localhost:8080/api/v1/me/books'
const DUNE_KEY = 'OL893415W'

describe('getShelf', () => {
  it('should return the parsed shelf entries', async () => {
    server.use(
      http.get(SHELF_URL, () =>
        HttpResponse.json({ data: [{ ...shelfEntry, status: 'CURRENTLY_READING' }] }),
      ),
    )

    const shelf = await getShelf()

    expect(shelf).toHaveLength(1)
    expect(shelf[0]?.key).toBe(DUNE_KEY)
    expect(shelf[0]?.status).toBe('CURRENTLY_READING')
  })

  it('should send the status filter as a query param', async () => {
    let receivedStatus: string | null = null
    server.use(
      http.get(SHELF_URL, ({ request }) => {
        receivedStatus = new URL(request.url).searchParams.get('status')
        return HttpResponse.json({ data: [{ ...shelfEntry, status: 'FINISHED' }] })
      }),
    )

    await getShelf('FINISHED')

    expect(receivedStatus).toBe('FINISHED')
  })

  it('should parse a sparse shelf entry', async () => {
    server.use(
      http.get(SHELF_URL, () =>
        HttpResponse.json({
          data: [
            {
              key: DUNE_KEY,
              title: 'Dune',
              authors: ['Frank Herbert'],
              status: 'WANT_TO_READ',
              favorite: false,
              addedAt: '2026-01-01',
            },
          ],
        }),
      ),
    )

    const shelf = await getShelf()

    expect(shelf[0]?.startedAt).toBeUndefined()
    expect(shelf[0]?.coverUrl).toBeUndefined()
  })

  it('should reject an entry with an unknown status value', async () => {
    server.use(
      http.get(SHELF_URL, () =>
        HttpResponse.json({ data: [{ ...shelfEntry, status: 'NOT_A_STATUS' }] }),
      ),
    )

    await expect(getShelf()).rejects.toThrow()
  })
})

describe('changeShelfStatus', () => {
  it('should update the shelf status', async () => {
    let received: unknown
    server.use(
      http.put(`${SHELF_URL}/${DUNE_KEY}/status`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({
          data: { ...shelfEntry, status: 'FINISHED', finishedAt: '2026-02-14' },
        })
      }),
    )

    const entry = await changeShelfStatus(DUNE_KEY, 'FINISHED')

    expect(received).toEqual({ status: 'FINISHED' })
    expect(entry.status).toBe('FINISHED')
    expect(entry.finishedAt).toBe('2026-02-14')
  })
})

describe('changeFavorite', () => {
  it('should update the favorite flag', async () => {
    let received: unknown
    server.use(
      http.put(`${SHELF_URL}/${DUNE_KEY}/favorite`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({ data: { ...shelfEntry, favorite: true } })
      }),
    )

    const entry = await changeFavorite(DUNE_KEY, true)

    expect(received).toEqual({ favorite: true })
    expect(entry.favorite).toBe(true)
  })
})

describe('removeFromShelf', () => {
  it('should delete the entry', async () => {
    let called = false
    server.use(
      http.delete(`${SHELF_URL}/${DUNE_KEY}`, () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await removeFromShelf(DUNE_KEY)

    expect(called).toBe(true)
  })
})
