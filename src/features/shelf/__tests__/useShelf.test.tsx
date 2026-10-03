import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import shelfEntry from '@/testing/mocks/shelf-entry.json'
import { server } from '@/testing/msw-server'

import { useShelf } from '../hooks/useShelf'

const SHELF_URL = 'http://localhost:8080/api/v1/me/books'

function entry(key: string, status: string) {
  return { ...shelfEntry, key, title: key, status }
}

describe('useShelf', () => {
  it('should return the shelf once loaded', async () => {
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

  it('should report an error when the shelf fails to load', async () => {
    server.use(http.get(SHELF_URL, () => new HttpResponse(null, { status: 500 })))

    const { result } = renderHook(() => useShelf())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.entries).toHaveLength(0)
  })
})
