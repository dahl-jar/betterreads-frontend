import { afterEach, describe, expect, it, vi } from 'vitest'

import draft from '@/testing/mocks/draft.json'

import { clearDrafts, readDraft, removeDraft, writeDraft } from './draftStore'

const STORED_KEY = 'betterreads:draft:user:review-comment:7'

function reloadPage() {
  const stored = Object.keys(localStorage).map((key) => [key, localStorage.getItem(key) ?? ''])
  clearDrafts()
  stored.forEach(([key = '', value = '']) => localStorage.setItem(key, value))
}

afterEach(() => {
  vi.restoreAllMocks()
  clearDrafts()
  localStorage.clear()
})

describe('draftStore', () => {
  it('should keep a draft apart per account', () => {
    writeDraft('user', 'review-comment:7', draft)

    const otherAccountDraft = readDraft('otheruser', 'review-comment:7')

    expect(readDraft('user', 'review-comment:7')).toEqual(draft)
    expect(otherAccountDraft).toBeUndefined()
  })

  it('should keep a draft after the page reloads', () => {
    writeDraft('user', 'review-comment:7', draft)
    reloadPage()

    const restored = readDraft('user', 'review-comment:7')

    expect(restored).toEqual(draft)
  })

  it('should remove only drafts when clearing', () => {
    localStorage.setItem('theme', 'dark')
    writeDraft('user', 'review:OL1W', draft)

    clearDrafts()

    expect(readDraft('user', 'review:OL1W')).toBeUndefined()
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('should keep a removed draft gone after the page reloads', () => {
    writeDraft('user', 'review-comment:7', draft)
    removeDraft('user', 'review-comment:7')
    reloadPage()

    const restored = readDraft('user', 'review-comment:7')

    expect(restored).toBeUndefined()
  })

  it.each([
    { stored: 'not json', reason: 'unreadable text' },
    { stored: '{"title":"No body"}', reason: 'a value without a body' },
    { stored: '{"body":"No date"}', reason: 'a value without a saved time' },
  ])('should ignore a stored draft with $reason', ({ stored }) => {
    localStorage.setItem(STORED_KEY, stored)

    const restored = readDraft('user', 'review-comment:7')

    expect(restored).toBeUndefined()
  })

  it('should keep a draft for the visit when storage refuses writes', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })

    writeDraft('user', 'review-comment:7', draft)

    expect(readDraft('user', 'review-comment:7')).toEqual(draft)
  })
})
