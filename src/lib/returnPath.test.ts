import { describe, expect, it } from 'vitest'

import { returnPathOf } from './returnPath'

describe('returnPathOf', () => {
  it.each([
    ['a protocol-relative path', '//attacker.example.test/books'],
    ['a full address', 'https://attacker.example.test/books'],
    ['the log in page', '/login?shelf=FINISHED'],
    ['the forgot password page', '/forgot-password'],
    ['a value that is not text', 42],
  ])('should go home for %s', (_case, from) => {
    const path = returnPathOf({ from })

    expect(path).toBe('/')
  })
})
