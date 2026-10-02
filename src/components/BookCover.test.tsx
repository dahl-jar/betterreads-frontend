import { describe, expect, it } from 'vitest'

import { fireEvent, render, screen } from '@/testing/test-utils'

import { BookCover } from './BookCover'

const COVER_URL = 'https://covers.example/dune.jpg'
const OTHER_COVER_URL = 'https://covers.example/dune-messiah.jpg'

describe('BookCover', () => {
  it('should show the cover image with empty alt text', () => {
    render(<BookCover coverUrl={COVER_URL} title="dune" className="w-32" />)

    const image = screen.getByRole('presentation')
    expect(image).toHaveAttribute('src', COVER_URL)
    expect(image).toHaveAttribute('alt', '')
    expect(screen.queryByText('D')).toBeNull()
  })

  it("should show the title's initial when there is no cover", () => {
    render(<BookCover coverUrl={null} title="dune" className="w-32" />)

    expect(screen.getByText('D')).toBeInTheDocument()
    expect(screen.queryByRole('presentation')).toBeNull()
  })

  it("should show the title's initial for a cover address that is not a web link", () => {
    render(<BookCover coverUrl="javascript:alert(1)" title="dune" className="w-32" />)

    expect(screen.getByText('D')).toBeInTheDocument()
    expect(screen.queryByRole('presentation')).toBeNull()
  })

  it('should swap to the initial when the image fails to load', () => {
    render(<BookCover coverUrl={COVER_URL} title="dune" className="w-32" />)

    fireEvent.error(screen.getByRole('presentation'))

    expect(screen.getByText('D')).toBeInTheDocument()
    expect(screen.queryByRole('presentation')).toBeNull()
  })

  it('should show "?" for a blank title', () => {
    render(<BookCover coverUrl={null} title="  " className="w-32" />)

    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('should show a new cover after the old one failed', () => {
    const { rerender } = render(<BookCover coverUrl={COVER_URL} title="dune" className="w-32" />)
    fireEvent.error(screen.getByRole('presentation'))

    rerender(<BookCover coverUrl={OTHER_COVER_URL} title="dune" className="w-32" />)

    expect(screen.getByRole('presentation')).toHaveAttribute('src', OTHER_COVER_URL)
  })
})
