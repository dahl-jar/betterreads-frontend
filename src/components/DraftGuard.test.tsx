import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, Link, Outlet, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { AuthProvider } from '@/app/components/AuthProvider'
import { useDraft } from '@/hooks/useDraft'
import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { clearDrafts, readDraft } from '@/lib/draftStore'
import { stubSignedIn } from '@/testing/authHandlers'

import { DraftGuardProvider, DraftNavigationGuard } from './DraftGuard'

function CommentBox() {
  const { draft, update } = useDraft('review-comment:7')
  return (
    <>
      <textarea
        aria-label="Add a comment"
        value={draft?.body ?? ''}
        onChange={(event) => update('body', event.target.value)}
      />
      <Link to="/elsewhere">Elsewhere</Link>
    </>
  )
}

function Layout() {
  return (
    <AuthProvider>
      <DraftGuardProvider>
        <DraftNavigationGuard />
        <Outlet />
      </DraftGuardProvider>
    </AuthProvider>
  )
}

async function renderPage() {
  stubSignedIn()
  const router = createMemoryRouter([
    {
      element: <Layout />,
      children: [
        { path: '/', element: <CommentBox /> },
        { path: '/elsewhere', element: <p>Another page</p> },
      ],
    },
  ])
  render(<RouterProvider router={router} />)
  const user = userEvent.setup()
  const box = await screen.findByRole('textbox', { name: 'Add a comment' })
  await waitFor(() => expect(box).toBeEnabled())
  return { user, router, box }
}

async function typeAndLeave() {
  const { user, router, box } = await renderPage()
  await user.type(box, 'Half a thought')
  await user.click(screen.getByRole('link', { name: 'Elsewhere' }))
  return { user, router }
}

function reload() {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return event
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
  clearDrafts()
})

describe('DraftNavigationGuard', () => {
  it('should ask before leaving the page with an unposted comment', async () => {
    await typeAndLeave()

    expect(
      await screen.findByRole('alertdialog', { name: 'Save your comment as a draft?' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Another page')).toBeNull()
  })

  it('should leave and drop the draft when it is discarded', async () => {
    const { user } = await typeAndLeave()

    await user.click(await screen.findByRole('button', { name: 'Discard' }))

    expect(await screen.findByText('Another page')).toBeInTheDocument()
    expect(readDraft('user', 'review-comment:7')).toBeUndefined()
  })

  it('should leave and keep the draft when it is saved', async () => {
    const { user } = await typeAndLeave()

    await user.click(await screen.findByRole('button', { name: 'Save draft' }))

    expect(await screen.findByText('Another page')).toBeInTheDocument()
    expect(readDraft('user', 'review-comment:7')?.body).toBe('Half a thought')
  })

  it('should ask before reloading with an unposted comment', async () => {
    const { user, box } = await renderPage()
    await user.type(box, 'Half a thought')

    const event = reload()

    expect(event.defaultPrevented).toBe(true)
  })

  it('should reload without asking when nothing was written', async () => {
    await renderPage()

    const event = reload()

    expect(event.defaultPrevented).toBe(false)
  })

  it('should stay on the page when leaving is cancelled', async () => {
    const { user, router } = await typeAndLeave()

    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(router.state.location.pathname).toBe('/')
    expect(screen.getByRole('textbox', { name: 'Add a comment' })).toHaveValue('Half a thought')
  })
})
