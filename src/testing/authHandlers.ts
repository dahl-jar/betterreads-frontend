import { http, HttpResponse } from 'msw'

import { makeAuthResponse } from './mocks/auth'
import { server } from './msw-server'

const AUTH_BASE = 'http://localhost:8080/api/v1/auth'

export function stubSignedIn() {
  server.use(
    http.post(`${AUTH_BASE}/refresh`, () => HttpResponse.json({ data: makeAuthResponse() })),
  )
}

export function stubSignedOut() {
  server.use(http.post(`${AUTH_BASE}/refresh`, () => new HttpResponse(null, { status: 401 })))
}
