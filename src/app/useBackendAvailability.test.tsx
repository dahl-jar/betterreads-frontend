import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { useBackendAvailability } from './useBackendAvailability'

const HEALTH_URL = 'http://localhost:8080/healthz'

describe('useBackendAvailability', () => {
  it('should report available when the backend responds', async () => {
    server.use(http.get(HEALTH_URL, () => HttpResponse.json({ status: 'UP' })))

    const { result } = renderHook(() => useBackendAvailability())

    await waitFor(() => expect(result.current.status).toBe('available'))
  })

  it('should recover after a manual retry reaches the backend', async () => {
    server.use(http.get(HEALTH_URL, () => HttpResponse.error()))
    const { result } = renderHook(() => useBackendAvailability())
    await waitFor(() => expect(result.current.status).toBe('unavailable'))

    server.use(http.get(HEALTH_URL, () => HttpResponse.json({ status: 'UP' })))
    act(() => result.current.retry())

    await waitFor(() => expect(result.current.status).toBe('available'))
  })
})
