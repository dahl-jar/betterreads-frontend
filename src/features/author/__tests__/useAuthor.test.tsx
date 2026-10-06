import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { useAuthor } from '../hooks/useAuthor'

const AUTHOR_URL = 'http://localhost:8080/api/v1/authors/87'

describe('useAuthor', () => {
  it('should report not found', async () => {
    server.use(http.get(AUTHOR_URL, () => new HttpResponse(null, { status: 404 })))

    const { result } = renderHook(() => useAuthor(87))

    await waitFor(() => expect(result.current.status).toBe('notFound'))
  })

  it('should report an error on a server failure', async () => {
    server.use(http.get(AUTHOR_URL, () => new HttpResponse(null, { status: 500 })))

    const { result } = renderHook(() => useAuthor(87))

    await waitFor(() => expect(result.current.status).toBe('error'))
  })
})
