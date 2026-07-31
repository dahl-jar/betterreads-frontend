import { describe, expect, it } from 'vitest'

import { render, screen, userEvent } from '@/testing/test-utils'

import { ShowMoreText } from '../components/ShowMoreText'

const LONG = Array.from({ length: 60 }, (_, i) => `sentence ${i}.`).join(' ')

describe('ShowMoreText', () => {
  it('should collapse long text', () => {
    render(<ShowMoreText text={LONG} collapsedChars={100} />)

    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument()
  })

  it('should reveal the full text', async () => {
    const user = userEvent.setup()
    render(<ShowMoreText text={LONG} collapsedChars={100} />)

    await user.click(screen.getByRole('button', { name: /show more/i }))

    expect(screen.getByText(LONG)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument()
  })

  it('should show short text in full with no toggle', () => {
    render(<ShowMoreText text="A short blurb." collapsedChars={100} />)

    expect(screen.getByText('A short blurb.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
