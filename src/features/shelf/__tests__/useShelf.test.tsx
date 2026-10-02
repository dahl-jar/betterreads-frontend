import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import shelfEntry from '@/testing/mocks/shelf-entry.json'
import { server } from '@/testing/msw-server'

import { type ReadingStatus } from '../api/shelfSchemas'
import { useShelf } from '../hooks/useShelf'

const SHELF_URL = 'http://localhost:8080/api/v1/me/books'

function entry(key: string, status: string) {
  return { ...shelfEntry, key, title: key, status }
}

describe('useShelf', () => {
  it('should expose the loaded shelf', async () => {
    server.use(
      http.get(SHELF_URL, () =>
        HttpResponse.json({
          data: [entry('OL1W', 'CURRENTLY_READING'), entry('OL2W', 'FINISHED')],
        }),
      ),
    )

    const { result } = renderHook(() => useShelf())

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.entries).toHaveLength(2)
  })

  it('should send the active status filter to the server', async () => {
    let receivedStatus: string | null = null
    server.use(
      http.get(SHELF_URL, ({ request }) => {
        receivedStatus = new URL(request.url).searchParams.get('status')
        return HttpResponse.json({ data: [entry('OL2W', 'FINISHED')] })
      }),
    )

    const { result } = renderHook(() => useShelf('FINISHED'))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(receivedStatus).toBe('FINISHED')
  })

  it('should hide stale entries while filtering', async () => {
    let markNextShelfStarted: () => void = () => undefined
    let releaseNextShelf: () => void = () => undefined
    const nextShelfStarted = new Promise<void>((resolve) => {
      markNextShelfStarted = resolve
    })
    const heldNextShelf = new Promise<void>((resolve) => {
      releaseNextShelf = resolve
    })
    server.use(
      http.get(SHELF_URL, async ({ request }) => {
        const status = new URL(request.url).searchParams.get('status')
        if (status === 'FINISHED') {
          return HttpResponse.json({ data: [entry('OL1W', 'FINISHED')] })
        }
        markNextShelfStarted()
        await heldNextShelf
        return HttpResponse.json({ data: [entry('OL2W', 'CURRENTLY_READING')] })
      }),
    )
    const { rerender, result } = renderHook(
      ({ filter }: { filter: ReadingStatus }) => useShelf(filter),
      {
        initialProps: { filter: 'FINISHED' as ReadingStatus },
      },
    )
    await waitFor(() => expect(result.current.status).toBe('success'))

    rerender({ filter: 'CURRENTLY_READING' })
    await nextShelfStarted

    expect(result.current.status).toBe('loading')
    expect(result.current.entries).toEqual([])

    releaseNextShelf()
    await waitFor(() => expect(result.current.entries[0]?.key).toBe('OL2W'))
  })

  it('should expose an error state when the request fails', async () => {
    server.use(http.get(SHELF_URL, () => new HttpResponse(null, { status: 500 })))

    const { result } = renderHook(() => useShelf())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.entries).toHaveLength(0)
  })
})
