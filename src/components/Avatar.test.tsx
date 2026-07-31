import { describe, expect, it } from 'vitest'

import { renderWithProviders, screen } from '@/testing/test-utils'

import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('should render the image as decorative when a url is given', () => {
    const { container } = renderWithProviders(
      <Avatar name="Darrow" url="https://img.example/darrow.png" />,
    )

    const image = container.querySelector('img')
    expect(image).toHaveAttribute('src', 'https://img.example/darrow.png')
    expect(image).toHaveAttribute('alt', '')
  })

  it('should fall back to the first initial', () => {
    renderWithProviders(<Avatar name="Mustang" />)

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('should show a placeholder when the name is empty', () => {
    renderWithProviders(<Avatar name="" />)

    expect(screen.getByText('?')).toBeInTheDocument()
  })
})
