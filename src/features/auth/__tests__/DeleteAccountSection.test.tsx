import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedOut } from '@/testing/authHandlers'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

import { DeleteAccountSection } from '../components/DeleteAccountSection'

const BASE = 'http://localhost:8080/api/v1/auth'

function stubDelete(status = 204) {
  let called = false
  server.use(
    http.delete(`${BASE}/me`, () => {
      called = true
      return new HttpResponse(null, { status })
    }),
  )
  return () => called
}

async function openDialog(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.click(screen.getByRole('button', { name: /delete my account/i }))
  return screen.getByRole('dialog')
}

async function renderOpenDialog() {
  const onDeleted = vi.fn()
  const { user } = renderWithProviders(<DeleteAccountSection onDeleted={onDeleted} />)
  await openDialog(user)
  return { user, onDeleted }
}

async function confirmDeletion(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.type(screen.getByRole('textbox'), 'delete')
  await user.click(screen.getByRole('button', { name: /delete account/i }))
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

beforeEach(stubSignedOut)

describe('DeleteAccountSection', () => {
  it('should open a confirmation dialog', async () => {
    const { user } = renderWithProviders(<DeleteAccountSection onDeleted={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await openDialog(user)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should require the confirmation word', async () => {
    const { user } = renderWithProviders(<DeleteAccountSection onDeleted={vi.fn()} />)
    await openDialog(user)

    const confirm = screen.getByRole('button', { name: /delete account/i })
    expect(confirm).toBeDisabled()

    await user.type(screen.getByRole('textbox'), 'delete')
    expect(confirm).toBeEnabled()
  })

  it('should delete after confirmation', async () => {
    stubDelete()
    const { user, onDeleted } = await renderOpenDialog()

    await confirmDeletion(user)

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1))
  })

  it('should cancel without deleting', async () => {
    const wasCalled = stubDelete()
    const { user } = renderWithProviders(<DeleteAccountSection onDeleted={vi.fn()} />)
    await openDialog(user)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(wasCalled()).toBe(false)
  })

  it('should keep the account when deletion fails', async () => {
    stubDelete(500)
    const { user, onDeleted } = await renderOpenDialog()

    await confirmDeletion(user)

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(onDeleted).not.toHaveBeenCalled()
  })
})
