import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { emptyPage } from '@/testing/emptyPage'
import authorHit from '@/testing/mocks/author-search-hit.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen } from '@/testing/test-utils'

import { AuthorResults } from '../components/AuthorResults'

const AUTHORS_URL = 'http://localhost:8080/api/v1/search/authors'

const SETTLE_MS = 300

describe('AuthorResults', () => {
  it('should link the author page', async () => {
    server.use(
      http.get(AUTHORS_URL, () =>
        HttpResponse.json({ data: [authorHit], meta: { total: 1, offset: 0, limit: 8 } }),
      ),
    )

    renderWithProviders(<AuthorResults query="tolkien" />)

    expect(await screen.findByRole('link', { name: /J\.R\.R\. Tolkien/ })).toHaveAttribute(
      'href',
      '/authors/29',
    )
  })

  it('should render nothing without hits', async () => {
    server.use(http.get(AUTHORS_URL, () => emptyPage()))

    renderWithProviders(<AuthorResults query="zzz" />)

    await expect(
      screen.findByRole('region', { name: 'Authors' }, { timeout: SETTLE_MS }),
    ).rejects.toThrow()
  })
})
