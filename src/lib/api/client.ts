import { z } from 'zod'

import { getAccessToken } from './token'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

const REQUEST_ID_HEADER = 'X-Request-Id'

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000

const RETRY_BACKOFF_MS = [150, 400] as const

export const MAX_ATTEMPTS = RETRY_BACKOFF_MS.length + 1

const IDEMPOTENT_METHODS = new Set(['GET', 'PUT', 'DELETE'])

const RETRYABLE_STATUSES = new Set([502, 503, 504])

const fieldErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
})

export type FieldError = z.infer<typeof fieldErrorSchema>

const pageMetaSchema = z.object({
  total: z.number(),
  offset: z.number(),
  limit: z.number(),
})

export type PageMeta = z.infer<typeof pageMetaSchema>

export type Page<T> = {
  data: T
  meta: PageMeta
}

type Envelope = {
  data: unknown
  meta?: unknown
}

const envelopeSchema = z.record(z.string(), z.unknown())

function parseEnvelope(value: unknown): Envelope {
  const envelope = envelopeSchema.parse(value)
  if (!Object.hasOwn(envelope, 'data')) {
    throw new Error('API response is missing data')
  }

  if (envelope.meta === undefined) {
    return { data: envelope.data }
  }

  return { data: envelope.data, meta: envelope.meta }
}

export class ApiError extends Error {
  readonly status: number
  readonly requestId: string | undefined
  readonly fieldErrors: FieldError[]

  constructor(
    status: number,
    requestId: string | undefined,
    message: string,
    fieldErrors: FieldError[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.requestId = requestId
    this.fieldErrors = fieldErrors
  }
}

type RequestOptions = {
  signal?: AbortSignal
}

type RefreshHandler = () => Promise<void>

let refreshHandler: RefreshHandler | undefined

export function setRefreshHandler(handler: RefreshHandler | undefined): void {
  refreshHandler = handler
}

function buildHeaders(method: string): Headers {
  const headers = new Headers({ Accept: 'application/json' })
  if (method !== 'GET') {
    headers.set('Content-Type', 'application/json')
  }
  const token = getAccessToken()
  if (token !== undefined) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return headers
}

const AUTH_REFRESH_PATH = '/api/v1/auth/refresh'

let inFlightRefresh: Promise<void> | undefined

function refreshAccessToken(handler: RefreshHandler): Promise<void> {
  if (inFlightRefresh === undefined) {
    inFlightRefresh = handler().finally(() => {
      inFlightRefresh = undefined
    })
  }
  return inFlightRefresh
}

type TimedRequestOptions = {
  requestOptions: RequestOptions
  cleanup: () => void
}

function addDefaultTimeout(options: RequestOptions): TimedRequestOptions {
  const controller = new AbortController()
  const callerSignal = options.signal
  const abortFromCaller = () => controller.abort(callerSignal?.reason)
  const timeout = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS)

  if (callerSignal?.aborted) {
    abortFromCaller()
  } else {
    callerSignal?.addEventListener('abort', abortFromCaller, { once: true })
  }

  return {
    requestOptions: { ...options, signal: controller.signal },
    cleanup: () => {
      clearTimeout(timeout)
      callerSignal?.removeEventListener('abort', abortFromCaller)
    },
  }
}

type SuccessBody = 'envelope' | 'ignore'

async function request(
  path: string,
  method: string,
  options: RequestOptions,
  body?: unknown,
  successBody: SuccessBody = 'envelope',
): Promise<Envelope> {
  const serializedBody = body === undefined ? undefined : JSON.stringify(body)
  const { requestOptions, cleanup } = addDefaultTimeout(options)

  try {
    let response = await sendWithRetry(path, method, requestOptions, serializedBody)

    const handler = refreshHandler
    if (response.status === 401 && handler !== undefined && path !== AUTH_REFRESH_PATH) {
      await refreshAccessToken(handler)
      response = await sendWithRetry(path, method, requestOptions, serializedBody)
    }

    if (!response.ok) {
      throw await toApiError(path, response)
    }

    if (response.status === 204 || successBody === 'ignore') {
      return { data: undefined }
    }
    return parseEnvelope(await response.json())
  } finally {
    cleanup()
  }
}

async function toApiError(path: string, response: Response): Promise<ApiError> {
  const requestId = response.headers.get(REQUEST_ID_HEADER) ?? undefined
  const fallback = `Request to ${path} failed with ${response.status}`

  const problem = await readProblem(response)
  if (problem === undefined) {
    return new ApiError(response.status, requestId, fallback)
  }

  const message = typeof problem.detail === 'string' ? problem.detail : fallback
  return new ApiError(response.status, requestId, message, parseFieldErrors(problem.errors))
}

const problemSchema = z.object({
  detail: z.unknown().optional(),
  errors: z.unknown().optional(),
})

type Problem = z.infer<typeof problemSchema>

function parseFieldErrors(errors: unknown): FieldError[] {
  if (!Array.isArray(errors)) {
    return []
  }
  return errors.flatMap((error) => {
    const result = fieldErrorSchema.safeParse(error)
    return result.success ? [result.data] : []
  })
}

async function readProblem(response: Response): Promise<Problem | undefined> {
  const contentType = response.headers.get('Content-Type') ?? ''
  if (!contentType.includes('json')) {
    return undefined
  }

  try {
    const parsed: unknown = await response.json()
    const result = problemSchema.safeParse(parsed)
    return result.success ? result.data : undefined
  } catch {
    return undefined
  }
}

function sendOnce(
  path: string,
  method: string,
  options: RequestOptions,
  serializedBody: string | undefined,
): Promise<Response> {
  const init: RequestInit = {
    method,
    headers: buildHeaders(method),
    credentials: 'include',
  }
  if (options.signal !== undefined) {
    init.signal = options.signal
  }
  if (serializedBody !== undefined) {
    init.body = serializedBody
  }
  return fetch(`${API_BASE_URL}${path}`, init)
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const onAbort = () => {
      clearTimeout(timer)
      resolve()
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Retries GET, PUT, and DELETE after network errors or 502/503/504 responses.
 * POST and PATCH are sent once to prevent duplicate writes.
 */
async function sendWithRetry(
  path: string,
  method: string,
  options: RequestOptions,
  serializedBody: string | undefined,
): Promise<Response> {
  const retryable = IDEMPOTENT_METHODS.has(method)
  let lastError: unknown

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    if (options.signal?.aborted) {
      throw options.signal.reason
    }
    try {
      const response = await sendOnce(path, method, options, serializedBody)
      if (!retryable || !RETRYABLE_STATUSES.has(response.status)) {
        return response
      }
      lastError = response
    } catch (error: unknown) {
      if (!retryable || options.signal?.aborted) {
        throw error
      }
      lastError = error
    }

    const backoff = RETRY_BACKOFF_MS[attempt]
    if (backoff !== undefined) {
      await sleep(backoff, options.signal)
    }
  }

  if (lastError instanceof Response) {
    return lastError
  }
  throw lastError
}

export async function apiCheck(path: string, options: RequestOptions = {}): Promise<void> {
  await request(path, 'GET', options, undefined, 'ignore')
}

export async function apiGet(path: string, options: RequestOptions = {}): Promise<unknown> {
  const envelope = await request(path, 'GET', options)
  return envelope.data
}

export async function apiGetPaged(
  path: string,
  options: RequestOptions = {},
): Promise<Page<unknown>> {
  const envelope = await request(path, 'GET', options)
  return { data: envelope.data, meta: pageMetaSchema.parse(envelope.meta) }
}

export async function apiPost(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<unknown> {
  const envelope = await request(path, 'POST', options, body)
  return envelope.data
}

export async function apiPut(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<unknown> {
  const envelope = await request(path, 'PUT', options, body)
  return envelope.data
}

export async function apiPatch(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<unknown> {
  const envelope = await request(path, 'PATCH', options, body)
  return envelope.data
}

export async function apiDelete(path: string, options: RequestOptions = {}): Promise<unknown> {
  const envelope = await request(path, 'DELETE', options)
  return envelope.data
}
