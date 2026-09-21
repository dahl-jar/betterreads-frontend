import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'
import { render, screen } from '@/testing/test-utils'

import { CatalogHeadline } from '../components/CatalogHeadline'

const COUNT_URL = 'http://localhost:8080/api/v1/books/count'

describe('CatalogHeadline', () => {
  it('should show the formatted book count as the heading', async () => {
    server.use(http.get(COUNT_URL, () => HttpResponse.json({ data: { total: 12_345 } })))

    render(<CatalogHeadline />)

    expect(
      await screen.findByRole('heading', { level: 1, name: /Search 12,345 books/ }),
    ).toBeVisible()
  })

  it('should fall back to a plain heading when the count fails', async () => {
    server.use(http.get(COUNT_URL, () => new HttpResponse(null, { status: 404 })))

    render(<CatalogHeadline />)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Search the catalog' }),
    ).toBeVisible()
  })
})
