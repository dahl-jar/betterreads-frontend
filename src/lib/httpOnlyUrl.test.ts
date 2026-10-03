import { describe, expect, it } from 'vitest'

import { httpOnlyUrl } from './httpOnlyUrl'

describe('httpOnlyUrl', () => {
  it.each(['http://example.test/a', 'https://example.test/a?b=1#c'])('should keep %s', (url) => {
    expect(httpOnlyUrl(url)).toBe(url)
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'mailto:user@example.test',
    '/books/dune',
  ])('should return "" for %s', (url) => {
    expect(httpOnlyUrl(url)).toBe('')
  })
})
