import { describe, expect, it } from 'vitest'

import { render, screen } from '@/testing/test-utils'

import { Markdown } from './Markdown'

describe('Markdown', () => {
  it('should render text formatting, quotes, and lists', () => {
    const source = [
      'A **bold** word, an *italic* word, and `inline` code.',
      '> quoted line',
      '- bullet item',
      '1. numbered item',
    ].join('\n\n')

    render(<Markdown source={source} />)

    expect(screen.getByRole('strong')).toHaveTextContent('bold')
    expect(screen.getByRole('emphasis')).toHaveTextContent('italic')
    expect(screen.getByRole('code')).toHaveTextContent('inline')
    expect(screen.getByRole('blockquote')).toHaveTextContent('quoted line')
    expect(screen.getAllByRole('list')).toHaveLength(2)
    const items = screen.getAllByRole('listitem').map((item) => item.textContent)
    expect(items).toEqual(['bullet item', 'numbered item'])
  })

  it('should drop raw HTML', () => {
    const source = ['Before <button>Press</button> after.', '<script>alert(1)</script>'].join(
      '\n\n',
    )

    render(<Markdown source={source} />)

    expect(screen.getByText(/before/i)).toBeInTheDocument()
    expect(screen.queryByText(/<button>/)).toBeNull()
    expect(screen.queryByText(/alert\(1\)/)).toBeNull()
  })

  it('should drop the target of a javascript or mailto link', () => {
    const source = '[run](javascript:alert(1)) and [mail](mailto:darrow@example.test)'

    render(<Markdown source={source} />)

    expect(screen.getByText('run')).toBeInTheDocument()
    expect(screen.getByText('mail')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('should open an https link in a new tab', () => {
    render(<Markdown source="[review](https://example.test/review)" />)

    const link = screen.getByRole('link', { name: 'review' })
    expect(link).toHaveAttribute('href', 'https://example.test/review')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('should not render an image', () => {
    const source = 'Cover: ![the cover](https://example.test/cover.png)'

    const { container } = render(<Markdown source={source} />)

    expect(screen.getByText(/cover:/i)).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('should show a heading line as plain text', () => {
    const source = ['# First', '## Second', '### Third'].join('\n\n')

    render(<Markdown source={source} />)

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Third')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('should keep the text of an element it does not render', () => {
    render(<Markdown source="#### Fourth" />)

    expect(screen.getByText('Fourth')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).toBeNull()
  })
})
