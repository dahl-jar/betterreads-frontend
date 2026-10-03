import { describe, expect, it } from 'vitest'

import { bookPath } from './bookPath'

describe('bookPath', () => {
  it('should encode a key with a slash', () => {
    expect(bookPath('OL1W/x')).toBe('/books/OL1W%2Fx')
  })
})
