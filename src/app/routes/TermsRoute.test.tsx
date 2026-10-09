import { beforeEach, describe, expect, it } from 'vitest'

import { CONTACT_EMAIL } from '@/app/siteLinks'
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

  it('should explain how to report an image', () => {
    renderWithProviders(<TermsRoute />, { route: '/terms' })

    expect(screen.getByText('Reporting images')).toBeInTheDocument()
    expect(
      screen.getByText(`emailing ${CONTACT_EMAIL} with the book's link`, { exact: false }),
    ).toBeInTheDocument()
  })
})
