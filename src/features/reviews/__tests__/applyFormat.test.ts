import { describe, expect, it } from 'vitest'

import { applyFormat } from '../utils/applyFormat'

describe('applyFormat', () => {
  it.each([
    { kind: 'bold', value: 'Hello **world**', start: 8, end: 13 },
    { kind: 'italic', value: 'Hello *world*', start: 7, end: 12 },
  ] as const)('should wrap the selection for $kind', ({ kind, value, start, end }) => {
    const formatted = applyFormat({ value: 'Hello world', start: 6, end: 11 }, kind)

    expect(formatted).toEqual({ value, start, end })
  })

  it.each([
    { kind: 'bold', value: 'Hello **bold text**', start: 8, end: 17 },
    { kind: 'italic', value: 'Hello *italic text*', start: 7, end: 18 },
    { kind: 'link', value: 'Hello [link text](https://)', start: 7, end: 16 },
  ] as const)(
    'should insert a selected placeholder for $kind with nothing selected',
    ({ kind, value, start, end }) => {
      const formatted = applyFormat({ value: 'Hello ', start: 6, end: 6 }, kind)

      expect(formatted).toEqual({ value, start, end })
    },
  )

  it('should wrap each paragraph of the selection', () => {
    const formatted = applyFormat({ value: 'one\n\ntwo', start: 0, end: 8 }, 'bold')

    expect(formatted).toEqual({ value: '**one**\n\n**two**', start: 0, end: 16 })
  })

  it('should not mark the line after the selection', () => {
    const formatted = applyFormat({ value: 'one\ntwo\nthree', start: 0, end: 8 }, 'ul')

    expect(formatted.value).toBe('- one\n- two\nthree')
  })

  it('should keep the linked text selected', () => {
    const formatted = applyFormat({ value: 'Visit site today', start: 6, end: 10 }, 'link')

    expect(formatted).toEqual({ value: 'Visit [site](https://) today', start: 7, end: 11 })
  })

  it.each([
    { kind: 'quote', value: 'one\n> two\n> three\nfour' },
    { kind: 'ul', value: 'one\n- two\n- three\nfour' },
  ] as const)('should mark every line the selection touches for $kind', ({ kind, value }) => {
    const formatted = applyFormat({ value: 'one\ntwo\nthree\nfour', start: 5, end: 10 }, kind)

    expect(formatted).toEqual({ value, start: 17, end: 17 })
  })

  it('should number the selected lines in order', () => {
    const formatted = applyFormat({ value: 'one\ntwo\nthree', start: 0, end: 13 }, 'ol')

    expect(formatted.value).toBe('1. one\n2. two\n3. three')
  })

  it("should mark the caret's line when nothing is selected", () => {
    const formatted = applyFormat({ value: 'one\ntwo\nthree', start: 4, end: 4 }, 'quote')

    expect(formatted.value).toBe('one\n> two\nthree')
  })
})
