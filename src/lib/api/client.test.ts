import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { holdResponse } from '@/testing/holdResponse'
import { server } from '@/testing/msw-server'

import {
  apiCheck,
  apiDelete,
  apiGet,
  apiGetPaged,
  apiPost,
  apiPut,
  ApiError,
  MAX_ATTEMPTS,
  setRefreshHandler,
} from './client'
import { clearAccessToken, setAccessToken } from './token'

const PROTECTED_URL = 'http://localhost:8080/api/v1/auth/me'
const REFRESH_URL = 'http://localhost:8080/api/v1/auth/refresh'
const HEALTH_URL = 'http://localhost:8080/healthz'

const PROBLEM_CONTENT_TYPE = 'application/problem+json'

type HeldRequest = {
  started: Promise<void>
  release: () => void
  getSignal: () => AbortSignal | undefined
}

function holdProtectedRequest(): HeldRequest {
  let requestSignal: AbortSignal | undefined
  const started = holdResponse()
  const response = holdResponse()
  server.use(
    http.get(PROTECTED_URL, async ({ request }) => {
      requestSignal = request.signal
      started.release()
      await response.held
      return HttpResponse.json({ data: { username: 'user' } })
    }),
  )
  return {
    started: started.held,
    release: response.release,
    getSignal: () => requestSignal,
  }
}

afterEach(() => {
  vi.useRealTimers()
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('envelope unwrap', () => {
  it('should return the data member of the success envelope', async () => {
    server.use(http.get(PROTECTED_URL, () => HttpResponse.json({ data: { username: 'user' } })))

    const result = await apiGet('/api/v1/auth/me')

    expect(result).toEqual({ username: 'user' })
  })

  it('should reject a success envelope with no data member', async () => {
    server.use(http.get(PROTECTED_URL, () => HttpResponse.json({ meta: null })))

    await expect(apiGet('/api/v1/auth/me')).rejects.toThrow('API response is missing data')
  })
})

describe('request timeout', () => {
  it('should apply the default timeout', async () => {
    vi.useFakeTimers()
    const heldRequest = holdProtectedRequest()

    const result = apiGet('/api/v1/auth/me')
    void result.catch(() => undefined)
    await heldRequest.started
    await vi.runAllTimersAsync()
    heldRequest.release()

    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('should keep the default timeout when a caller signal is present', async () => {
    vi.useFakeTimers()
    const heldRequest = holdProtectedRequest()
    const callerController = new AbortController()

    const result = apiGet('/api/v1/auth/me', {
      signal: callerController.signal,
    })
    void result.catch(() => undefined)
    await heldRequest.started
    await vi.runAllTimersAsync()
    heldRequest.release()

    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
    expect(callerController.signal.aborted).toBe(false)
  })

  it('should clean up after a caller abort', async () => {
    vi.useFakeTimers()
    const heldRequest = holdProtectedRequest()
    const callerController = new AbortController()
    const reason = new DOMException('Superseded', 'AbortError')
    const result = apiGet('/api/v1/auth/me', { signal: callerController.signal })
    void result.catch(() => undefined)
    await heldRequest.started
    expect(vi.getTimerCount()).toBe(1)

    callerController.abort(reason)
    const requestSignal = heldRequest.getSignal()
    heldRequest.release()

    await expect(result).rejects.toBe(reason)
    expect(requestSignal?.aborted).toBe(true)
    expect(requestSignal?.reason).toBe(reason)
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('apiCheck', () => {
  it('should resolve for a successful response without an envelope', async () => {
    server.use(http.get(HEALTH_URL, () => HttpResponse.json({ status: 'UP' })))

    const result = apiCheck('/healthz')

    await expect(result).resolves.toBeUndefined()
  })
})

describe('apiGetPaged', () => {
  const COMMENTS_URL = 'http://localhost:8080/api/v1/books/OL1W/comments'

  it('should return the data items alongside the pagination meta', async () => {
    server.use(
      http.get(COMMENTS_URL, () =>
        HttpResponse.json({ data: [{ id: 1 }], meta: { total: 7, offset: 0, limit: 20 } }),
      ),
    )

    const result = await apiGetPaged('/api/v1/books/OL1W/comments')

    expect(result).toEqual({ data: [{ id: 1 }], meta: { total: 7, offset: 0, limit: 20 } })
  })

  it('should reject a paged envelope with no meta member', async () => {
    server.use(http.get(COMMENTS_URL, () => HttpResponse.json({ data: [] })))

    await expect(apiGetPaged('/api/v1/books/OL1W/comments')).rejects.toThrow()
  })

  it('should reject malformed pagination counts', async () => {
    server.use(
      http.get(COMMENTS_URL, () =>
        HttpResponse.json({
          data: [],
          meta: { total: 'seven', offset: 0, limit: 20 },
        }),
      ),
    )

    await expect(apiGetPaged('/api/v1/books/OL1W/comments')).rejects.toThrow()
  })
})

describe('problem+json errors', () => {
  it('should carry the problem detail as the error message', async () => {
    server.use(
      http.get(PROTECTED_URL, () =>
        HttpResponse.json(
          { title: 'Not Found', status: 404, detail: 'No book with that key' },
          { status: 404, headers: { 'Content-Type': PROBLEM_CONTENT_TYPE } },
        ),
      ),
    )

    const error = await apiGet('/api/v1/auth/me').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).message).toBe('No book with that key')
    expect((error as ApiError).status).toBe(404)
  })

  it('should expose per-field validation errors from a 400 problem', async () => {
    server.use(
      http.put(SHELF_URL, () =>
        HttpResponse.json(
          {
            title: 'Bad Request',
            status: 400,
            detail: 'Validation failed',
            errors: [{ field: 'rating', message: 'must be between 1 and 5' }],
          },
          { status: 400, headers: { 'Content-Type': PROBLEM_CONTENT_TYPE } },
        ),
      ),
    )

    const error = await apiPut('/api/v1/me/books/OL1W/status', { status: 'X' }).catch(
      (caught: unknown) => caught,
    )

    expect((error as ApiError).fieldErrors).toEqual([
      { field: 'rating', message: 'must be between 1 and 5' },
    ])
  })

  it('should ignore malformed field errors without hiding the problem detail', async () => {
    server.use(
      http.put(SHELF_URL, () =>
        HttpResponse.json(
          {
            title: 'Bad Request',
            status: 400,
            detail: 'Validation failed',
            errors: [{ field: 5, message: ['wrong shape'] }],
          },
          {
            status: 400,
            headers: { 'Content-Type': PROBLEM_CONTENT_TYPE, 'X-Request-Id': 'request-123' },
          },
        ),
      ),
    )

    const error = await apiPut('/api/v1/me/books/OL1W/status', {
      status: 'X',
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      message: 'Validation failed',
      requestId: 'request-123',
      fieldErrors: [],
    })
  })

  it('should use a generic message for non-problem errors', async () => {
    server.use(http.get(PROTECTED_URL, () => new HttpResponse(null, { status: 503 })))

    const error = await apiGet('/api/v1/auth/me').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(503)
  })
})

describe('content type', () => {
  it('should send JSON headers on a bodiless POST', async () => {
    let contentType: string | null = 'unset'
    server.use(
      http.post(REFRESH_URL, ({ request }) => {
        contentType = request.headers.get('Content-Type')
        return HttpResponse.json({ data: { accessToken: 'jwt' } })
      }),
    )

    await apiPost('/api/v1/auth/refresh', undefined)

    expect(contentType).toBe('application/json')
  })

  it('should omit the content type on a GET', async () => {
    let contentType: string | null = 'unset'
    server.use(
      http.get(PROTECTED_URL, ({ request }) => {
        contentType = request.headers.get('Content-Type')
        return HttpResponse.json({ data: { ok: true } })
      }),
    )

    await apiGet('/api/v1/auth/me')

    expect(contentType).toBeNull()
  })
})

describe('apiGet auth refresh', () => {
  it('should retry a 401 request after refreshing', async () => {
    setAccessToken('stale-token')
    let attempts = 0
    server.use(
      http.get(PROTECTED_URL, ({ request }) => {
        attempts += 1
        const auth = request.headers.get('Authorization')
        if (auth === 'Bearer fresh-token') {
          return HttpResponse.json({ data: { ok: true } })
        }
        return new HttpResponse(null, { status: 401 })
      }),
    )
    const refreshHandler = vi.fn(() => {
      setAccessToken('fresh-token')
      return Promise.resolve()
    })
    setRefreshHandler(refreshHandler)

    const result = await apiGet('/api/v1/auth/me')

    expect(result).toEqual({ ok: true })
    expect(refreshHandler).toHaveBeenCalledTimes(1)
    expect(attempts).toBe(2)
  })

  it('should share one refresh between concurrent 401s', async () => {
    setAccessToken('stale-token')
    let staleRequests = 0
    const refreshPending = holdResponse()
    server.use(
      http.get(PROTECTED_URL, ({ request }) => {
        if (request.headers.get('Authorization') === 'Bearer fresh-token') {
          return HttpResponse.json({ data: { ok: true } })
        }
        staleRequests += 1
        return new HttpResponse(null, { status: 401 })
      }),
    )
    const refreshHandler = vi.fn(async () => {
      await refreshPending.held
      setAccessToken('fresh-token')
    })
    setRefreshHandler(refreshHandler)

    const requests = Promise.all([apiGet('/api/v1/auth/me'), apiGet('/api/v1/auth/me')])
    void requests.catch(() => undefined)
    await vi.waitFor(() => expect(staleRequests).toBe(2))
    refreshPending.release()

    await expect(requests).resolves.toEqual([{ ok: true }, { ok: true }])
    expect(refreshHandler).toHaveBeenCalledTimes(1)
  })

  it('should refresh only once per request', async () => {
    setAccessToken('stale-token')
    server.use(http.get(PROTECTED_URL, () => new HttpResponse(null, { status: 401 })))
    const refreshHandler = vi.fn(() => {
      setAccessToken('still-bad')
      return Promise.resolve()
    })
    setRefreshHandler(refreshHandler)

    await expect(apiGet('/api/v1/auth/me')).rejects.toBeInstanceOf(ApiError)
    expect(refreshHandler).toHaveBeenCalledTimes(1)
  })

  it('should not attempt refresh when no handler is registered', async () => {
    setAccessToken('stale-token')
    let attempts = 0
    server.use(
      http.get(PROTECTED_URL, () => {
        attempts += 1
        return new HttpResponse(null, { status: 401 })
      }),
    )

    await expect(apiGet('/api/v1/auth/me')).rejects.toBeInstanceOf(ApiError)
    expect(attempts).toBe(1)
  })

  it('should not refresh a failed refresh request', async () => {
    let refreshAttempts = 0
    server.use(
      http.post(REFRESH_URL, () => {
        refreshAttempts += 1
        return new HttpResponse(null, { status: 401 })
      }),
    )
    const refreshHandler = vi.fn(async () => {
      await apiPost('/api/v1/auth/refresh', undefined)
    })
    setRefreshHandler(refreshHandler)

    await expect(apiPost('/api/v1/auth/refresh', undefined)).rejects.toBeInstanceOf(ApiError)
    expect(refreshAttempts).toBe(1)
    expect(refreshHandler).not.toHaveBeenCalled()
  })
})

describe('retry on a transient failure', () => {
  const LIST_URL = 'http://localhost:8080/api/v1/books'
  const STATUS_URL = 'http://localhost:8080/api/v1/me/books/OL1W/status'
  const REMOVE_URL = 'http://localhost:8080/api/v1/me/books/OL1W'

  it('should retry a GET after a 503', async () => {
    let attempts = 0
    server.use(
      http.get(LIST_URL, () => {
        attempts += 1
        if (attempts === 1) {
          return new HttpResponse(null, { status: 503 })
        }
        return HttpResponse.json({ data: [{ key: 'OL1W' }] })
      }),
    )

    const result = await apiGet('/api/v1/books')

    expect(result).toEqual([{ key: 'OL1W' }])
    expect(attempts).toBe(2)
  })

  it('should throw the last error after the retry budget', async () => {
    let attempts = 0
    server.use(
      http.get(LIST_URL, () => {
        attempts += 1
        return new HttpResponse(null, { status: 503 })
      }),
    )

    const error = await apiGet('/api/v1/books').catch((caught: unknown) => caught)

    expect((error as ApiError).status).toBe(503)
    expect(attempts).toBe(MAX_ATTEMPTS)
  })

  it('should retry an idempotent PUT', async () => {
    let attempts = 0
    server.use(
      http.put(STATUS_URL, () => {
        attempts += 1
        if (attempts === 1) {
          return new HttpResponse(null, { status: 502 })
        }
        return HttpResponse.json({ data: { status: 'CURRENTLY_READING' } })
      }),
    )

    const result = await apiPut('/api/v1/me/books/OL1W/status', { status: 'CURRENTLY_READING' })

    expect(result).toEqual({ status: 'CURRENTLY_READING' })
    expect(attempts).toBe(2)
  })

  it('should retry an idempotent DELETE', async () => {
    let attempts = 0
    server.use(
      http.delete(REMOVE_URL, () => {
        attempts += 1
        if (attempts === 1) {
          return new HttpResponse(null, { status: 504 })
        }
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const result = await apiDelete('/api/v1/me/books/OL1W')

    expect(result).toBeUndefined()
    expect(attempts).toBe(2)
  })

  it('should not retry a POST', async () => {
    let attempts = 0
    server.use(
      http.post(LIST_URL, () => {
        attempts += 1
        return new HttpResponse(null, { status: 503 })
      }),
    )

    await expect(apiPost('/api/v1/books', { title: 'x' })).rejects.toBeInstanceOf(ApiError)
    expect(attempts).toBe(1)
  })

  it('should not retry a 4xx', async () => {
    let attempts = 0
    server.use(
      http.get(LIST_URL, () => {
        attempts += 1
        return new HttpResponse(null, { status: 404 })
      }),
    )

    await expect(apiGet('/api/v1/books')).rejects.toBeInstanceOf(ApiError)
    expect(attempts).toBe(1)
  })

  it('should retry a GET after a network error', async () => {
    let attempts = 0
    server.use(
      http.get(LIST_URL, () => {
        attempts += 1
        if (attempts === 1) {
          return HttpResponse.error()
        }
        return HttpResponse.json({ data: [] })
      }),
    )

    const result = await apiGet('/api/v1/books')

    expect(result).toEqual([])
    expect(attempts).toBe(2)
  })

  it('should not retry once the caller aborts', async () => {
    let attempts = 0
    server.use(
      http.get(LIST_URL, () => {
        attempts += 1
        return new HttpResponse(null, { status: 503 })
      }),
    )
    const controller = new AbortController()
    const reason = new DOMException('Superseded', 'AbortError')
    controller.abort(reason)

    await expect(apiGet('/api/v1/books', { signal: controller.signal })).rejects.toBe(reason)
    expect(attempts).toBe(0)
  })
})

const SHELF_URL = 'http://localhost:8080/api/v1/me/books/OL1W/status'
