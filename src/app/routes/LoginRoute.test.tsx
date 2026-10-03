import { http, HttpResponse } from 'msw'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { AuthenticatedPage } from '@/app/components/AuthenticatedPage'
import { LoginLink } from '@/components/LoginLink'
import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedOut } from '@/testing/authHandlers'
import { CurrentLocation } from '@/testing/CurrentLocation'
import auth from '@/testing/mocks/auth.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen } from '@/testing/test-utils'

import { ForgotPasswordRoute } from './ForgotPasswordRoute'
import { LoginRoute } from './LoginRoute'
import { RegisterRoute } from './RegisterRoute'

const API = 'http://localhost:8080/api/v1'
const BOOK_PAGE = '/books/OL893415W?tab=reviews'

function BackButton() {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => void navigate(-1)}>
      Back
    </button>
  )
}

function renderApp(route: string) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/books/:key"
        element={
          <>
            <LoginLink>Log in to rate this book</LoginLink>
            <BackButton />
            <CurrentLocation />
          </>
        }
      />
      <Route
        path="/shelf"
        element={
          <AuthenticatedPage>
            <CurrentLocation />
          </AuthenticatedPage>
        }
      />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/register" element={<RegisterRoute />} />
      <Route path="/forgot-password" element={<ForgotPasswordRoute />} />
      <Route path="*" element={<CurrentLocation />} />
    </Routes>,
    { route },
  )
}

async function logIn(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.type(await screen.findByLabelText(/email or username/i), 'user@example.com')
  await user.type(screen.getByLabelText(/^password/i), 'opensesame')
  await user.click(screen.getByRole('button', { name: /log in/i }))
}

beforeEach(() => {
  stubSignedOut()
  server.use(
    http.get(`${API}/books`, () => HttpResponse.json({ data: [] })),
    http.post(`${API}/auth/login`, () => HttpResponse.json({ data: auth })),
  )
})

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

async function followLinks(names: string[]) {
  const rendered = renderApp(BOOK_PAGE)
  for (const name of ['Log in to rate this book', ...names]) {
    await rendered.user.click(await screen.findByRole('link', { name }))
  }
  return rendered
}

describe('LoginRoute', () => {
  it.each([
    ['straight from it', []],
    ['through Register and back', ['Create an account', 'Log in']],
    ['through Forgot password and back', ['Forgot password?', 'Back to log in']],
  ])('should return to the book page after logging in %s', async (_route, detour) => {
    const { user } = await followLinks(detour)

    await logIn(user)

    expect(await screen.findByText(BOOK_PAGE)).toBeInTheDocument()
  })

  it.each([
    ['My books after the signed-out redirect', '/shelf', '/shelf'],
    ['home when no page was recorded', '/login', '/'],
  ])('should go to %s', async (_case, start, destination) => {
    const { user } = renderApp(start)

    await logIn(user)

    expect(await screen.findByText(destination)).toBeInTheDocument()
  })

  it('should leave the log in page out of the history after logging in', async () => {
    const { user } = await followLinks([])
    await logIn(user)
    await screen.findByText(BOOK_PAGE)

    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(await screen.findByText(BOOK_PAGE)).toBeInTheDocument()
  })
})
