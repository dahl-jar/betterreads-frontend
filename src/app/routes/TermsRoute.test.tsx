import { beforeEach, describe, expect, it } from 'vitest'

import { stubSignedOut } from '@/testing/authHandlers'
import { renderWithProviders, screen } from '@/testing/test-utils'

import { TermsRoute } from './TermsRoute'

beforeEach(stubSignedOut)

describe('TermsRoute', () => {
  it('should credit the data sources', () => {
    renderWithProviders(<TermsRoute />, { route: '/terms' })

    expect(screen.getByText('Data sources')).toBeInTheDocument()
    expect(screen.getByText(/Ratings marked Hardcover come from Hardcover/)).toBeInTheDocument()
  })
})
