import { describe, expect, it } from 'vitest'

import { renderWithProviders, screen } from '@/testing/test-utils'

import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('should render the image as decorative when a url is given', () => {
    const { container } = renderWithProviders(
      <Avatar name="User" url="https://img.example/user.png" />,
    )

    const image = container.querySelector('img')
    expect(image).toHaveAttribute('src', 'https://img.example/user.png')
    expect(image).toHaveAttribute('alt', '')
  })

  it('should fall back to the first initial', () => {
    renderWithProviders(<Avatar name="Other user" />)

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('O')).toBeInTheDocument()
  })

  it('should show a placeholder when the name is empty', () => {
    renderWithProviders(<Avatar name="" />)

    expect(screen.getByText('?')).toBeInTheDocument()
  })
})
