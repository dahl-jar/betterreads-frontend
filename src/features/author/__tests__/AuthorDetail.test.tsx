import { describe, expect, it } from 'vitest'

import authorPage from '@/testing/mocks/author-page.json'
import { renderWithProviders, screen } from '@/testing/test-utils'

import { type AuthorPage } from '../api/getAuthor'
import { AuthorDetail } from '../components/AuthorDetail'

const [seriesBook, standaloneBook] = authorPage.books

function render(author: AuthorPage) {
  return renderWithProviders(<AuthorDetail author={author} />)
}

describe('AuthorDetail', () => {
  it('should list series books before other books', () => {
    render({ ...authorPage, books: [standaloneBook!, seriesBook!] })

    const regions = screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))

    expect(regions).toEqual(['The Stormlight Archive', 'Other books'])
  })

  it('should show the role next to the year for a non-author credit', () => {
    render({ ...authorPage, books: [{ ...standaloneBook!, role: 'ILLUSTRATOR' }] })

    expect(screen.getByText('2005 · Illustrator')).toBeInTheDocument()
  })

  it('should show only the year for an author credit', () => {
    render({ ...authorPage, books: [standaloneBook!] })

    expect(screen.getByText('2005')).toBeInTheDocument()
  })

  it('should link a biography given as a web address', () => {
    render({ ...authorPage, bio: 'https://example.com/biography' })

    expect(screen.getByRole('link', { name: 'Biography' })).toHaveAttribute(
      'href',
      'https://example.com/biography',
    )
  })
})
