import { type ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import draft from '@/testing/mocks/draft.json'
import review from '@/testing/mocks/review.json'
import { render, screen, userEvent, within } from '@/testing/test-utils'

import { REVIEW_BODY_MAX } from '../api/reviewSchemas'
import { ReviewEditor } from '../components/ReviewEditor'

type ReviewEditorProps = ComponentProps<typeof ReviewEditor>

function renderEditor(overrides: Partial<ReviewEditorProps> = {}) {
  const props: ReviewEditorProps = {
    review: undefined,
    rating: 4,
    pending: false,
    onRate: vi.fn(),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    onTextChange: vi.fn(),
    ...overrides,
  }
  return { user: userEvent.setup(), props, ...render(<ReviewEditor {...props} />) }
}

describe('ReviewEditor', () => {
  it.each([
    { button: 'Bold', formatted: 'Hello **world**' },
    { button: 'Italic', formatted: 'Hello *world*' },
    { button: 'Quote', formatted: '> Hello world' },
    { button: 'Bulleted list', formatted: '- Hello world' },
    { button: 'Numbered list', formatted: '1. Hello world' },
    { button: 'Link', formatted: 'Hello [world](https://)' },
  ])('should format the selected text with $button', async ({ button, formatted }) => {
    const { user } = renderEditor()
    const body = screen.getByLabelText('Review')
    await user.type(body, 'Hello world')
    await user.pointer([
      { keys: '[MouseLeft>]', target: body, offset: 6 },
      { offset: 11 },
      { keys: '[/MouseLeft]' },
    ])
    const toolbar = screen.getByRole('toolbar', { name: 'Formatting' })

    await user.click(within(toolbar).getByRole('button', { name: button }))

    expect(screen.getByLabelText('Review')).toHaveValue(formatted)
  })

  it('should leave the text unchanged when formatting would pass 5,000 characters', async () => {
    const nearlyFull = 'x'.repeat(REVIEW_BODY_MAX - 1)
    const { user } = renderEditor({ review: { ...review, body: nearlyFull } })

    await user.click(screen.getByRole('button', { name: 'Bold' }))

    expect(screen.getByLabelText('Review')).toHaveValue(nearlyFull)
  })

  it('should count the characters of the body', async () => {
    const { user } = renderEditor()

    await user.type(screen.getByLabelText('Review'), 'Spice.')

    expect(screen.getByText('6 / 5,000')).toBeInTheDocument()
  })

  it('should render the body as Markdown under Preview', async () => {
    const { user } = renderEditor()
    await user.type(screen.getByLabelText('Review'), 'A **bold** claim.')

    await user.click(screen.getByRole('tab', { name: 'Preview' }))

    expect(screen.getByRole('strong')).toHaveTextContent('bold')
    expect(screen.queryByRole('textbox', { name: 'Review' })).toBeNull()
  })

  it('should say there is nothing to preview for an empty body', async () => {
    const { user } = renderEditor()

    await user.click(screen.getByRole('tab', { name: 'Preview' }))

    expect(screen.getByText('Nothing to preview yet.')).toBeInTheDocument()
  })

  it('should keep the text when returning to Write', async () => {
    const { user } = renderEditor()
    await user.type(screen.getByLabelText('Review'), 'A **bold** claim.')
    await user.click(screen.getByRole('tab', { name: 'Preview' }))

    await user.click(screen.getByRole('tab', { name: 'Write' }))

    expect(screen.getByRole('textbox', { name: 'Review' })).toHaveValue('A **bold** claim.')
  })

  it.each([
    { reason: 'no rating', rating: 0, pending: false },
    { reason: 'a save in flight', rating: 4, pending: true },
  ])('should disable Save review with $reason', ({ rating, pending }) => {
    renderEditor({ rating, pending })

    expect(screen.getByRole('button', { name: 'Save review' })).toBeDisabled()
  })

  it('should submit the trimmed title and body', async () => {
    const { user, props } = renderEditor()
    await user.type(screen.getByLabelText('Title'), '  Golden path ')
    await user.type(screen.getByLabelText('Review'), ' The ending earned it.  ')

    await user.click(screen.getByRole('button', { name: 'Save review' }))

    expect(props.onSubmit).toHaveBeenCalledWith({
      title: 'Golden path',
      body: 'The ending earned it.',
    })
  })

  it('should start from the draft over the saved review', () => {
    renderEditor({ review, draft: { ...draft, title: 'Unfinished', body: 'Half done.' } })

    expect(screen.getByLabelText('Title')).toHaveValue('Unfinished')
    expect(screen.getByLabelText('Review')).toHaveValue('Half done.')
  })

  it.each([
    { label: 'Title', field: 'title' },
    { label: 'Review', field: 'body' },
  ])('should report a change to the $label text', async ({ label, field }) => {
    const { user, props } = renderEditor()

    await user.type(screen.getByLabelText(label), 'G')

    expect(props.onTextChange).toHaveBeenCalledWith(field, 'G')
  })

  it('should report the formatted text as a change', async () => {
    const { user, props } = renderEditor()
    await user.click(screen.getByRole('button', { name: 'Bold' }))

    expect(props.onTextChange).toHaveBeenLastCalledWith('body', '**bold text**')
  })

  it('should report a cancel', async () => {
    const { user, props } = renderEditor()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(props.onCancel).toHaveBeenCalledTimes(1)
  })
})
