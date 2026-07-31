import { render, screen } from '@testing-library/react'
import { lazy, type ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AppLayout } from './AppLayout'
import { AuthProvider } from './AuthProvider'

const Suspends = lazy(() => new Promise<{ default: () => ReactElement }>(() => undefined))

function renderLayout(child: ReactElement) {
  const router = createMemoryRouter(
    [{ path: '/', element: <AppLayout />, children: [{ index: true, element: child }] }],
    { initialEntries: ['/'] },
  )
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

describe('AppLayout', () => {
  it('should keep the shell while page content is suspended', () => {
    renderLayout(<Suspends />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('should announce the route fallback while the page is suspended', () => {
    renderLayout(<Suspends />)

    expect(screen.getByRole('status', { name: /loading.*page/i })).toBeInTheDocument()
  })

  it('should render the page content inside the shell once it resolves', () => {
    renderLayout(<p>Loaded page</p>)

    expect(screen.getByText('Loaded page')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })
})
